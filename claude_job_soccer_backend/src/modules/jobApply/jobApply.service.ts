import { JobApply } from "./jobApply.model";
import { TJobApply } from "./jobApply.interface";
import AppError from "../../errors/AppError";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import { Job } from "../Job/job.model";
import { User } from "../user/user.model";
import { CandidateRole } from "../user/user.interface";
import { calculateJobMatchScore } from "../../shared/openai/jobMatching.service";

// Import Candidate Models for profile details
import { AmateurPlayerCan } from "../candidate/amateurPlayerCan/amateurPlayerCan.model";
import { ProfessionalPlayerCan } from "../candidate/professionalPlayerCan/professionalPlayerCan.model";
import { OnFieldStaffCan } from "../candidate/onFieldStaffCan/onFieldStaffCan.model";
import { OfficeStaffCan } from "../candidate/officeStaffCan/officeStaffCan.model";
import { HighSchoolCan } from "../candidate/highSchoolCan/highSchoolCan.model";
import { CollegeOrUniversity } from "../candidate/collegeOrUniversityCan/collegeOrUniversityCan.model";

// Import Supplementary Data Models
import { CandidateExperience } from "../candidateExperience/candidateExperience.model";
import { CandidateEducation } from "../candidateEducation/candidateEducation.model";
import { CandidateLicenseAndCertification } from "../candidateLicensesAndCertification/candidateLicensesAndCertification.model";
import { CandidateEducationService } from "../candidateEducation/candidateEducation.service";
import { CandidateLicensesAndCertificationService } from "../candidateLicensesAndCertification/candidateLicensesAndCertification.service";

/**
 * Get candidate model based on role
 */
const getCandidateModel = (role: CandidateRole): any => {
  switch (role) {
    case CandidateRole.PROFESSIONAL_PLAYER:
      return ProfessionalPlayerCan;
    case CandidateRole.AMATEUR_PLAYER:
      return AmateurPlayerCan;
    case CandidateRole.HIGH_SCHOOL:
      return HighSchoolCan;
    case CandidateRole.COLLEGE_UNIVERSITY:
      return CollegeOrUniversity;
    case CandidateRole.ON_FIELD_STAFF:
      return OnFieldStaffCan;
    case CandidateRole.OFFICE_STAFF:
      return OfficeStaffCan;
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid candidate role");
  }
};

/**
 * Calculate total years of experience from experience records
 */
const calculateYearsOfExperience = (experiences: any[]): number => {
  let totalMonths = 0;
  const currentDate = new Date();

  experiences.forEach((exp) => {
    const startDate = new Date(
      exp.startYear,
      getMonthNumber(exp.startMonth),
      1
    );
    let endDate: Date;

    if (exp.isCurrentlyWorking) {
      endDate = currentDate;
    } else if (exp.endYear && exp.endMonth) {
      endDate = new Date(exp.endYear, getMonthNumber(exp.endMonth), 1);
    } else {
      return; // Skip if no end date and not currently working
    }

    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    totalMonths += months > 0 ? months : 0;
  });

  return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert month name to month number (0-11)
 */
const getMonthNumber = (monthName: string): number => {
  const months: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };
  return months[monthName] || 0;
};

/**
 * Apply to a job
 */
const applyToJob = async (
  candidateId: string,
  jobId: string,
  resumeUrl?: string
): Promise<TJobApply> => {
  // Validate IDs
  if (!Types.ObjectId.isValid(candidateId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid candidate ID");
  }
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid job ID");
  }

  // Check if job exists and is active
  const job = await Job.findById(jobId).lean();
  if (!job) {
    throw new AppError(StatusCodes.NOT_FOUND, "Job not found");
  }
  if (job.status !== "active") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This job is no longer accepting applications"
    );
  }

  // Check if candidate has already applied (including soft-deleted applications)
  const existingApplication = await JobApply.findOne({
    jobId,
    candidateId,
  });

  // If there's an active application, throw error
  if (existingApplication && !existingApplication.isDeleted) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You have already applied to this job"
    );
  }

  // Get candidate details
  const candidate = await User.findById(candidateId).lean();
  if (!candidate) {
    throw new AppError(StatusCodes.NOT_FOUND, "Candidate not found");
  }

  if (candidate.userType !== "candidate") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only candidates can apply to jobs"
    );
  }

  // Get candidate's complete profile
  const candidateModel = getCandidateModel(candidate.role as CandidateRole);
  const candidateProfile = await candidateModel
    .findById(candidate.profileId)
    .lean();

  if (!candidateProfile) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Candidate profile not found. Please complete your profile before applying."
    );
  }

  // Build enriched candidate data for AI matching
  const enrichedCandidateData: Record<string, any> = {
    ...candidateProfile,
    role: candidate.role,
  };

  // Determine if this is a player role
  const playerRoles = [
    CandidateRole.PROFESSIONAL_PLAYER,
    CandidateRole.AMATEUR_PLAYER,
    CandidateRole.HIGH_SCHOOL,
    CandidateRole.COLLEGE_UNIVERSITY,
  ];
  const isPlayerRole = playerRoles.includes(candidate.role as CandidateRole);

  // For non-player roles (office staff and on-field staff), fetch supplementary data
  if (!isPlayerRole) {
    const [experiences, educations, certifications] = await Promise.all([
      CandidateExperience.find({ userId: candidateId }).lean(),
      CandidateEducation.find({ userId: candidateId }).lean(),
      CandidateLicenseAndCertification.find({ userId: candidateId }).lean(),
    ]);

    // Add experience data if available
    if (experiences && experiences.length > 0) {
      enrichedCandidateData.experiences = experiences;
      // Calculate total years of experience
      const totalYears = calculateYearsOfExperience(experiences);
      enrichedCandidateData.totalYearsOfExperience = totalYears;
    }

    // Add education data if available
    if (educations && educations.length > 0) {
      enrichedCandidateData.educations = educations;
    }

    // Add certifications data if available
    if (certifications && certifications.length > 0) {
      enrichedCandidateData.certifications = certifications;
    }
  }
  // For player roles, only use profile data (no experience, education, certifications)

  // Calculate AI match score between job and candidate
  const aiMatchPercentage = await calculateJobMatchScore(
    job,
    enrichedCandidateData,
    candidate.role as string
  );

  // Check if job has a required AI score threshold
  //TODO: Temporarily disable AI score threshold check
  // if (job.requiredAiScore && aiMatchPercentage < job.requiredAiScore) {
  //   throw new AppError(
  //     StatusCodes.FORBIDDEN,
  //     `Your profile match score (${aiMatchPercentage}%) is below the required threshold (${job.requiredAiScore}%) for this job. Please improve your profile or apply to jobs that better match your qualifications.`
  //   );
  // }

  let application;

  // If there's a previously withdrawn application, reactivate it
  if (existingApplication && existingApplication.isDeleted) {
    application = await JobApply.findByIdAndUpdate(
      existingApplication._id,
      {
        appliedAt: new Date(),
        aiMatchPercentage,
        resumeUrl,
        isDeleted: false,
      },
      { new: true }
    );
  } else {
    // Create new application
    application = await JobApply.create({
      jobId,
      candidateId,
      appliedAt: new Date(),
      aiMatchPercentage,
      resumeUrl,
      isDeleted: false,
    });
  }

  // Increment job application count
  await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: 1 } });

  return application!.toObject();
};

/**
 * Get all applications for a specific job
 * OPTIMIZED: Uses compound index { jobId: 1, isDeleted: 1, aiMatchPercentage: -1 }
 * Returns applicant name, AI score, and resume download link
 */
const getApplicationsByJob = async (
  jobId: string,
  query: Record<string, any>
) => {
  // Validate job ID
  if (!Types.ObjectId.isValid(jobId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid job ID");
  }

  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new AppError(StatusCodes.NOT_FOUND, "Job not found");
  }

  // Pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Sorting (default: highest AI match first)
  let sortBy: any = { aiMatchPercentage: -1 };
  if (query.sortBy) {
    if (query.sortBy.startsWith("-")) {
      sortBy = { [query.sortBy.substring(1)]: -1 };
    } else {
      sortBy = { [query.sortBy]: 1 };
    }
  }

  // Query applications
  const applications = await JobApply.find({
    jobId,
    isDeleted: false,
  })
    .sort(sortBy)
    .skip(skip)
    .limit(limit)
    .populate(
      "candidateId",
      "firstName lastName email profileImage role"
    )
    .lean();

  // Get total count for pagination
  const total = await JobApply.countDocuments({
    jobId,
    isDeleted: false,
  });

  // Format response
  const formattedApplications = applications.map((app: any) => ({
    _id: app._id,
    applicantName: `${app.candidateId.firstName} ${app.candidateId.lastName}`,
    applicantEmail: app.candidateId.email,
    applicantProfileImage: app.candidateId.profileImage,
    candidateId: app.candidateId._id,
    candidateRole: app.candidateId.role,
    aiMatchPercentage: app.aiMatchPercentage || null,
    resumeUrl: app.resumeUrl || null,
    appliedAt: app.appliedAt,
    createdAt: app.createdAt,
  }));

  return {
    data: formattedApplications,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Get applicant profile details with necessary info
 * Returns full candidate profile based on their role
 */
const getApplicantProfile = async (candidateId: string) => {
  // Validate candidate ID
  if (!Types.ObjectId.isValid(candidateId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid candidate ID");
  }

  // Get user/candidate basic info
  const user = await User.findById(candidateId).lean();
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Candidate not found");
  }

  if (user.userType !== "candidate") {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not a candidate");
  }

  // Get profile details based on role
  const candidateModel = getCandidateModel(user.role as CandidateRole);
  const profile = await candidateModel.findById(user.profileId).lean();

  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Candidate profile not found");
  }
  const educations = await CandidateEducationService.getAllEducationsByUser(
    candidateId
  );
  const experiences = await CandidateEducationService.getAllEducationsByUser(
    candidateId
  );
  const certifications =
    await CandidateLicensesAndCertificationService.getAllLicensesAndCertificationsByUser(
      candidateId
    );

  // Return combined user and profile data
  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    profile,
    educations,
    experiences,
    certifications,
  };
};

/**
 * Get candidate's own applications (for candidate to see their applied jobs)
 */
const getCandidateApplications = async (
  candidateId: string,
  query: Record<string, any>
) => {
  // Validate candidate ID
  if (!Types.ObjectId.isValid(candidateId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid candidate ID");
  }

  // Pagination
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Query applications
  const applications = await JobApply.find({
    candidateId,
    isDeleted: false,
  })
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("jobId")
    .lean();

  // Get total count
  const total = await JobApply.countDocuments({
    candidateId,
    isDeleted: false,
  });

  return {
    data: applications,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Delete/withdraw an application
 */
const deleteApplication = async (applicationId: string, userId: string) => {
  // Validate application ID
  if (!Types.ObjectId.isValid(applicationId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid application ID");
  }

  // Get application
  const application = await JobApply.findById(applicationId);
  if (!application) {
    throw new AppError(StatusCodes.NOT_FOUND, "Application not found");
  }

  // Check authorization (only the candidate who applied can withdraw)
  if (application.candidateId.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to delete this application"
    );
  }

  // Soft delete
  await JobApply.updateOne({ _id: applicationId }, { isDeleted: true });

  // Decrement job application count
  await Job.updateOne(
    { _id: application.jobId },
    { $inc: { applicationCount: -1 } }
  );

  return { message: "Application withdrawn successfully" };
};

export const JobApplyService = {
  applyToJob,
  getApplicationsByJob,
  getApplicantProfile,
  getCandidateApplications,
  deleteApplication,
};
