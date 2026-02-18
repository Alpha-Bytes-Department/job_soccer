import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "./user.model";
import { CandidateRole, EmployerRole } from "./user.interface";
import { VideoType } from "../../shared/constant/video.constant";

import { QueryBuilder } from "../../shared/builder/QueryBuilder";
import { unlinkFileSync } from "../../shared/util/unlinkFile";
import { logger } from "../../shared/logger/logger";

// Import video helpers
import {
  validateVideos,
  validatePlayerVideos,
  processVideos,
  processPlayerVideos,
  cleanupUploadedFiles,
} from "../../shared/util/videoHelper";

// Import AI video scoring
import {
  scoreStaffVideosFromUpload,
  scoreStaffVideosFromStored,
} from "../../shared/openai/videoScoring.service";

// Import AI profile scoring
import { generateProfileScore } from "../../shared/openai/profileScoring.service";

// Import Candidate DTOs
import { AmateurPlayerCanDto } from "../candidate/amateurPlayerCan/amateurPlayerCan.dto";
import { ProfessionalPlayerCanDto } from "../candidate/professionalPlayerCan/professionalPlayerCan.dto";
import { OnFieldStaffCanDto } from "../candidate/onFieldStaffCan/onFieldStaffCan.dto";
import { OfficeStaffCanDto } from "../candidate/officeStaffCan/officeStaffCan.dto";
import { HighSchoolCanDto } from "../candidate/highSchoolCan/highSchoolCan.dto";
import { CollegeOrUniversityCanDto } from "../candidate/collegeOrUniversityCan/collegeOrUniversityCan.dto";

// Import Candidate Models
import { AmateurPlayerCan } from "../candidate/amateurPlayerCan/amateurPlayerCan.model";
import { ProfessionalPlayerCan } from "../candidate/professionalPlayerCan/professionalPlayerCan.model";
import { OnFieldStaffCan } from "../candidate/onFieldStaffCan/onFieldStaffCan.model";
import { OfficeStaffCan } from "../candidate/officeStaffCan/officeStaffCan.model";
import { HighSchoolCan } from "../candidate/highSchoolCan/highSchoolCan.model";
import { CollegeOrUniversity } from "../candidate/collegeOrUniversityCan/collegeOrUniversityCan.model";

// Import Employer DTOs
import { AcademyEmpDto } from "../employer/academyEmp/academyEmp.dto";
import { AgentEmpDto } from "../employer/agentEmp/agentEmp.dto";
import { AmateurClubEmpDto } from "../employer/amateurClubEmp/amateurClubEmp.dto";
import { CollegeOrUniversityEmpDto } from "../employer/collegeOrUniversityEmp/collegeOrUniversityEmp.dto";
import { ConsultingCompanyEmpDto } from "../employer/consultingCompanyEmp/consultingCompanyEmp.dto";
import { HighSchoolEmpDto } from "../employer/highSchoolEmp/highSchoolEmp.dto";
import { ProfessionalClubEmpDto } from "../employer/professionalClubEmp/professionalClubEmp.dto";

// Import Employer Models
import { AcademyEmp } from "../employer/academyEmp/academyEmp.model";
import { AgentEmp } from "../employer/agentEmp/agentEmp.model";
import { AmateurClubEmp } from "../employer/amateurClubEmp/amateurClubEmp.model";
import { CollegeOrUniversityEmp } from "../employer/collegeOrUniversityEmp/collegeOrUniversityEmp.model";
import { ConsultingCompanyEmp } from "../employer/consultingCompanyEmp/consultingCompanyEmp.model";
import { HighSchoolEmp } from "../employer/highSchoolEmp/highSchoolEmp.model";

import { ProfessionalClubEmp } from "../employer/professionalClubEmp/professionalClubEmp.model";
import { CandidateEducationService } from "../candidateEducation/candidateEducation.service";
import { CandidateExperienceService } from "../candidateExperience/candidateExperience.service";
import { CandidateLicensesAndCertificationService } from "../candidateLicensesAndCertification/candidateLicensesAndCertification.service";
import { AdminVerificationService } from "../adminVerification/adminVerification.service";

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query)
    .search(["firstName", "lastName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return { result, meta };
};
const getUserById = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Fetch profile based on userType and role
  let profile: any = null;

  if (user.profileId) {
    if (user.userType === "candidate") {
      switch (user.role) {
        case CandidateRole.AMATEUR_PLAYER:
          profile = await AmateurPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.PROFESSIONAL_PLAYER:
          profile = await ProfessionalPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.ON_FIELD_STAFF:
          profile = await OnFieldStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.OFFICE_STAFF:
          profile = await OfficeStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.HIGH_SCHOOL:
          profile = await HighSchoolCan.findById(user.profileId).lean();
          break;
        case CandidateRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversity.findById(user.profileId).lean();
          break;
      }
    } else if (user.userType === "employer") {
      switch (user.role) {
        case EmployerRole.ACADEMY:
          profile = await AcademyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AGENT:
          profile = await AgentEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AMATEUR_CLUB:
          profile = await AmateurClubEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversityEmp.findById(
            user.profileId
          ).lean();
          break;
        case EmployerRole.CONSULTING_COMPANY:
          profile = await ConsultingCompanyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.HIGH_SCHOOL:
          profile = await HighSchoolEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.PROFESSIONAL_CLUB:
          profile = await ProfessionalClubEmp.findById(user.profileId).lean();
          break;
      }
    }
  }
  const educations = await CandidateEducationService.getAllEducationsByUser(
    userId
  );
  const experiences = await CandidateExperienceService.getAllExperiencesByUser(
    userId
  );
  const certifications =
    await CandidateLicensesAndCertificationService.getAllLicensesAndCertificationsByUser(
      userId
    );
  // const
  return {
    ...user,
    profile,
    educations,
    experiences,
    certifications,
  };
};
const updateUser = async (id: string, updateData: any) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (updateData.image && user.profileImage) {
    unlinkFileSync(user.profileImage);
  }

  const updatedUser = await User.findByIdAndUpdate(id, updateData, {
    new: true,
  });

  if (!updatedUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User update failed");
  }
  return updatedUser;
};
const updateUserActivationStatus = async (
  id: string,
  status: "active" | "delete"
) => {
  console.log(status);
  console.log(id);

  const user = await User.findByIdAndUpdate(
    id,
    { status: status },
    { new: true }
  );
  console.log(user);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};
const updateUserRole = async (id: string, role: "USER" | "ADMIN") => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { role } },
    { new: true }
  );
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const getMe = async (userId: string): Promise<any> => {
  // Query the database using lean with virtuals enabled.
  const user = await User.findById(userId).lean({
    virtuals: true,
  });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Get subscription details
  let subscriptionInfo = null;
  if (user.activeSubscriptionId) {
    const { Subscription } = await import("../subscription/subscription.model");
    const subscription = await Subscription.findById(
      user.activeSubscriptionId
    ).lean();
    if (subscription) {
      const isActive =
        subscription.status === "active" &&
        subscription.currentPeriodEnd &&
        new Date(subscription.currentPeriodEnd) > new Date();

      subscriptionInfo = {
        hasActiveSubscription: isActive,
        interval: subscription.interval,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        remainingDays: subscription.currentPeriodEnd
          ? Math.max(
              0,
              Math.ceil(
                (new Date(subscription.currentPeriodEnd).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 0,
      };
    }
  }

  // Fetch profile based on userType and role
  let profile: any = null;

  if (user.profileId) {
    if (user.userType === "candidate") {
      switch (user.role) {
        case CandidateRole.AMATEUR_PLAYER:
          profile = await AmateurPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.PROFESSIONAL_PLAYER:
          profile = await ProfessionalPlayerCan.findById(user.profileId).lean();
          break;
        case CandidateRole.ON_FIELD_STAFF:
          profile = await OnFieldStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.OFFICE_STAFF:
          profile = await OfficeStaffCan.findById(user.profileId).lean();
          break;
        case CandidateRole.HIGH_SCHOOL:
          profile = await HighSchoolCan.findById(user.profileId).lean();
          break;
        case CandidateRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversity.findById(user.profileId).lean();
          break;
      }
    } else if (user.userType === "employer") {
      switch (user.role) {
        case EmployerRole.ACADEMY:
          profile = await AcademyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AGENT:
          profile = await AgentEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.AMATEUR_CLUB:
          profile = await AmateurClubEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.COLLEGE_UNIVERSITY:
          profile = await CollegeOrUniversityEmp.findById(
            user.profileId
          ).lean();
          break;
        case EmployerRole.CONSULTING_COMPANY:
          profile = await ConsultingCompanyEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.HIGH_SCHOOL:
          profile = await HighSchoolEmp.findById(user.profileId).lean();
          break;
        case EmployerRole.PROFESSIONAL_CLUB:
          profile = await ProfessionalClubEmp.findById(user.profileId).lean();
          break;
      }
    }
  }
  const educations = await CandidateEducationService.getAllEducationsByUser(
    userId
  );
  const experiences = await CandidateExperienceService.getAllExperiencesByUser(
    userId
  );
  const certifications =
    await CandidateLicensesAndCertificationService.getAllLicensesAndCertificationsByUser(
      userId
    );
  const adminVerificationStatus =
    await AdminVerificationService.getUserVerificationStatus(userId);
  if (
    profile &&
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF)
  ) {
    // AiVideoVideoScore is now computed by AI during video upload
    profile.AiVideoVideoScore = profile.AiVideoVideoScore ?? null;
  }
  // aiProfileScore is computed by AI during profile creation/update
  user.aiProfileScore = user?.aiProfileScore ?? 0;

  return {
    ...user,
    profile,
    educations,
    experiences,
    certifications,
    subscription: subscriptionInfo,
    adminVerificationStatus: adminVerificationStatus,
  };
};

const addUserProfile = async (payload: {
  userId: string;
  data: any;
  profileImage?: string | null;
  videoFiles?: Express.Multer.File[];
  videoMetadata?: any[];
  videoTitles?: string[];
}) => {
  const {
    userId,
    data,
    profileImage,
    videoFiles = [],
    videoMetadata,
    videoTitles,
  } = payload;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user already has a profile
  if (user.profileId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User already has a profile. Use update instead."
    );
  }

  let validatedData: any;
  let profileId: string;

  // Handle Candidate Profiles
  if (user.userType === "candidate") {
    switch (user.role) {
      case CandidateRole.AMATEUR_PLAYER:
        // Validate player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "Amateur Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          // Process player videos
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          data.videos = processedVideos;
        }

        validatedData =
          AmateurPlayerCanDto.createAmateurPlayerCanDto.parse(data);
        const amateurPlayer = await AmateurPlayerCan.create(validatedData);
        profileId = amateurPlayer._id.toString();
        break;

      case CandidateRole.PROFESSIONAL_PLAYER:
        // Validate player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "Professional Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          // Process player videos
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          data.videos = processedVideos;
        }

        validatedData =
          ProfessionalPlayerCanDto.createProfessionalPlayerCanDto.parse(data);
        const professionalPlayer = await ProfessionalPlayerCan.create(
          validatedData
        );
        profileId = professionalPlayer._id.toString();
        break;

      case CandidateRole.ON_FIELD_STAFF:
        // Videos are REQUIRED for all On Field Staff positions
        if (videoFiles.length === 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Videos are required for ${
              data.position || "On Field Staff"
            }. Please upload the required videos.`
          );
        }

        if (!videoMetadata) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Video metadata (videoMeta) is required for staff profiles"
          );
        }

        const onFieldValidation = await validateVideos(
          data.position,
          videoMetadata,
          videoFiles
        );
        if (!onFieldValidation.isValid) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(StatusCodes.BAD_REQUEST, onFieldValidation.error!);
        }

        // Process staff videos
        const onFieldProcessedVideos = await processVideos(
          videoFiles,
          videoMetadata
        );
        data.videos = onFieldProcessedVideos;

        // AI Video Scoring
        let onFieldVideoScore: number | null = null;
        try {
          const onFieldScoreResult = await scoreStaffVideosFromUpload({
            videoFiles,
            role: CandidateRole.ON_FIELD_STAFF,
            position: data.position,
          });
          if (onFieldScoreResult.totalScore > 0) {
            onFieldVideoScore = onFieldScoreResult.totalScore;
          }
        } catch (scoringError) {
          logger.error("AI video scoring failed (non-blocking):", { error: scoringError });
        }

        validatedData = OnFieldStaffCanDto.createOnFieldStaffCanDto.parse(data);
        // Set score after Zod parse (Zod strips unknown fields)
        if (onFieldVideoScore !== null) {
          validatedData.AiVideoVideoScore = onFieldVideoScore;
        }
        const onFieldStaff = await OnFieldStaffCan.create(validatedData);
        profileId = onFieldStaff._id.toString();
        break;

      case CandidateRole.HIGH_SCHOOL:
        // Videos are required for High School players
        if (videoFiles.length === 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "High School players must upload exactly 2 Highlights videos"
          );
        }

        const highSchoolValidation = await validatePlayerVideos(
          videoFiles,
          "High School Player"
        );
        if (!highSchoolValidation.isValid) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            highSchoolValidation.error!
          );
        }

        // Process player videos
        const highSchoolVideos = await processPlayerVideos(
          videoFiles,
          videoTitles || []
        );
        data.videos = highSchoolVideos;

        validatedData = HighSchoolCanDto.createHighSchoolCanDto.parse(data);
        const highSchool = await HighSchoolCan.create(validatedData);
        profileId = highSchool._id.toString();
        break;

      case CandidateRole.COLLEGE_UNIVERSITY:
        // Videos are required for College/University players
        if (videoFiles.length === 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "College/University Player players must upload exactly 2 Highlights videos"
          );
        }

        const collegeValidation = await validatePlayerVideos(
          videoFiles,
          "College/University Player"
        );
        if (!collegeValidation.isValid) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(StatusCodes.BAD_REQUEST, collegeValidation.error!);
        }

        // Process player videos
        const collegeVideos = await processPlayerVideos(
          videoFiles,
          videoTitles || []
        );
        data.videos = collegeVideos;

        validatedData =
          CollegeOrUniversityCanDto.createCollegeOrUniversityCanDto.parse(data);
        const collegeOrUniversity = await CollegeOrUniversity.create(
          validatedData
        );
        profileId = collegeOrUniversity._id.toString();
        break;

      case CandidateRole.OFFICE_STAFF:
        // Office Staff requires at least 1 video (Pre-recorded Interview mandatory)
        if (videoFiles.length === 0) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            `Office Staff requires at least 1 video (Pre-recorded Interview is mandatory)`
          );
        }

        if (!videoMetadata) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Video metadata (videoMeta) is required for staff profiles"
          );
        }

        const officeStaffValidation = await validateVideos(
          data.position,
          videoMetadata,
          videoFiles
        );
        if (!officeStaffValidation.isValid) {
          await cleanupUploadedFiles(videoFiles);
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            officeStaffValidation.error!
          );
        }

        // Process staff videos
        const officeStaffProcessedVideos = await processVideos(
          videoFiles,
          videoMetadata
        );
        data.videos = officeStaffProcessedVideos;

        // AI Video Scoring
        let officeVideoScore: number | null = null;
        try {
          const officeScoreResult = await scoreStaffVideosFromUpload({
            videoFiles,
            role: CandidateRole.OFFICE_STAFF,
            position: data.position,
          });
          if (officeScoreResult.totalScore > 0) {
            officeVideoScore = officeScoreResult.totalScore;
          }
        } catch (scoringError) {
          logger.error("AI video scoring failed (non-blocking):", { error: scoringError });
        }

        validatedData = OfficeStaffCanDto.createOfficeStaffCanDto.parse(data);
        // Set score after Zod parse (Zod strips unknown fields)
        if (officeVideoScore !== null) {
          validatedData.AiVideoVideoScore = officeVideoScore;
        }
        const officeStaff = await OfficeStaffCan.create(validatedData);
        profileId = officeStaff._id.toString();
        break;

      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid candidate role: ${user.role}`
        );
    }
  }
  // Handle Employer Profiles
  else if (user.userType === "employer") {
    switch (user.role) {
      case EmployerRole.ACADEMY:
        validatedData = AcademyEmpDto.createAcademyEmpDto.parse(data);
        const academy = await AcademyEmp.create(validatedData);
        profileId = academy._id.toString();
        break;

      case EmployerRole.AGENT:
        validatedData = AgentEmpDto.createAgentEmpDto.parse(data);
        const agent = await AgentEmp.create(validatedData);
        profileId = agent._id.toString();
        break;

      case EmployerRole.AMATEUR_CLUB:
        validatedData = AmateurClubEmpDto.createAmateurClubEmpDto.parse(data);
        const amateurClub = await AmateurClubEmp.create(validatedData);
        profileId = amateurClub._id.toString();
        break;

      case EmployerRole.COLLEGE_UNIVERSITY:
        validatedData =
          CollegeOrUniversityEmpDto.createCollegeOrUniversityEmpDto.parse(data);
        const collegeOrUniversityEmp = await CollegeOrUniversityEmp.create(
          validatedData
        );
        profileId = collegeOrUniversityEmp._id.toString();
        break;

      case EmployerRole.CONSULTING_COMPANY:
        validatedData =
          ConsultingCompanyEmpDto.createConsultingCompanyEmpDto.parse(data);
        const consultingCompany = await ConsultingCompanyEmp.create(
          validatedData
        );
        profileId = consultingCompany._id.toString();
        break;

      case EmployerRole.HIGH_SCHOOL:
        validatedData = HighSchoolEmpDto.createHighSchoolEmpDto.parse(data);
        const highSchoolEmp = await HighSchoolEmp.create(validatedData);
        profileId = highSchoolEmp._id.toString();
        break;

      case EmployerRole.PROFESSIONAL_CLUB:
        validatedData =
          ProfessionalClubEmpDto.createProfessionalClubEmpDto.parse(data);
        const professionalClub = await ProfessionalClubEmp.create(
          validatedData
        );
        profileId = professionalClub._id.toString();
        break;

      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid employer role: ${user.role}`
        );
    }
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Admin users cannot have profiles"
    );
  }

  // Update user with profileId and profileImage
  const updateData: any = { profileId };
  if (profileImage) {
    updateData.profileImage = profileImage;
  }

  // AI Profile Scoring for all candidates (non-blocking)
  if (user.userType === "candidate" && validatedData) {
    try {
      const profileScore = await generateProfileScore(
        validatedData,
        user.role as CandidateRole
      );
      if (profileScore > 0) {
        updateData.aiProfileScore = profileScore;
      }
    } catch (scoringError) {
      logger.error("AI profile scoring failed (non-blocking):", { error: scoringError });
    }
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!updatedUser) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update user with profile ID"
    );
  }

  return {
    user: updatedUser,
    profileId,
  };
};

const updateUserProfile = async (payload: {
  userId: string;
  data: any;
  profileImage?: string | null;
  bannerImage?: string | null;
  videoFiles?: Express.Multer.File[];
  videoMetadata?: any[];
  videoTitles?: string[];
}) => {
  const {
    userId,
    data,
    profileImage,
    bannerImage,
    videoFiles = [],
    videoMetadata,
    videoTitles,
  } = payload;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user has a profile to update
  if (!user.profileId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User does not have a profile. Use create profile instead."
    );
  }

  // Separate user fields from profile fields
  const userFields = ["firstName", "lastName"];
  const userUpdateData: any = {};
  const profileData: any = { ...data }; // Copy all data to profileData first

  // Remove email from update data if present (email cannot be updated via profile update)
  if (profileData.email) {
    delete profileData.email;
  }

  // Extract user-specific fields from profileData and move to userUpdateData
  for (const field of userFields) {
    if (field in profileData) {
      userUpdateData[field] = profileData[field];
      delete profileData[field];
    }
  }

  let validatedData: any;
  let Model: any;
  let DtoValidator: any;

  // Handle Candidate Profiles
  if (user.userType === "candidate") {
    switch (user.role) {
      case CandidateRole.AMATEUR_PLAYER:
        Model = AmateurPlayerCan;
        DtoValidator = AmateurPlayerCanDto.updateAmateurPlayerCanDto;

        // Handle player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "Amateur Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          profileData.videos = processedVideos;
        }
        break;

      case CandidateRole.PROFESSIONAL_PLAYER:
        Model = ProfessionalPlayerCan;
        DtoValidator = ProfessionalPlayerCanDto.updateProfessionalPlayerCanDto;

        // Handle player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "Professional Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          profileData.videos = processedVideos;
        }
        break;

      case CandidateRole.ON_FIELD_STAFF:
        Model = OnFieldStaffCan;
        DtoValidator = OnFieldStaffCanDto.updateOnFieldStaffCanDto;

        // Handle staff videos if provided
        if (videoFiles.length > 0) {
          if (!videoMetadata) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              "Video metadata (videoMeta) is required for staff profiles"
            );
          }
          const validation = await validateVideos(
            profileData.position || data.position,
            videoMetadata,
            videoFiles
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processVideos(
            videoFiles,
            videoMetadata
          );
          profileData.videos = processedVideos;
        }
        break;

      case CandidateRole.HIGH_SCHOOL:
        Model = HighSchoolCan;
        DtoValidator = HighSchoolCanDto.updateHighSchoolCanDto;

        // Handle player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "High School Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          profileData.videos = processedVideos;
        }
        break;

      case CandidateRole.COLLEGE_UNIVERSITY:
        Model = CollegeOrUniversity;
        DtoValidator =
          CollegeOrUniversityCanDto.updateCollegeOrUniversityCanDto;

        // Handle player videos if provided
        if (videoFiles.length > 0) {
          const validation = await validatePlayerVideos(
            videoFiles,
            "College/University Player"
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processPlayerVideos(
            videoFiles,
            videoTitles || []
          );
          profileData.videos = processedVideos;
        }
        break;

      case CandidateRole.OFFICE_STAFF:
        Model = OfficeStaffCan;
        DtoValidator = OfficeStaffCanDto.updateOfficeStaffCanDto;

        // Handle staff videos if provided
        if (videoFiles.length > 0) {
          if (!videoMetadata) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(
              StatusCodes.BAD_REQUEST,
              "Video metadata (videoMeta) is required for staff profiles"
            );
          }
          const validation = await validateVideos(
            profileData.position || data.position,
            videoMetadata,
            videoFiles
          );
          if (!validation.isValid) {
            await cleanupUploadedFiles(videoFiles);
            throw new AppError(StatusCodes.BAD_REQUEST, validation.error!);
          }
          const processedVideos = await processVideos(
            videoFiles,
            videoMetadata
          );
          profileData.videos = processedVideos;
        }
        break;

      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid candidate role: ${user.role}`
        );
    }
  }
  // Handle Employer Profiles
  else if (user.userType === "employer") {
    switch (user.role) {
      case EmployerRole.ACADEMY:
        Model = AcademyEmp;
        DtoValidator = AcademyEmpDto.updateAcademyEmpDto;
        break;

      case EmployerRole.AGENT:
        Model = AgentEmp;
        DtoValidator = AgentEmpDto.updateAgentEmpDto;
        break;

      case EmployerRole.AMATEUR_CLUB:
        Model = AmateurClubEmp;
        DtoValidator = AmateurClubEmpDto.updateAmateurClubEmpDto;
        break;

      case EmployerRole.COLLEGE_UNIVERSITY:
        Model = CollegeOrUniversityEmp;
        DtoValidator =
          CollegeOrUniversityEmpDto.updateCollegeOrUniversityEmpDto;
        break;

      case EmployerRole.CONSULTING_COMPANY:
        Model = ConsultingCompanyEmp;
        DtoValidator = ConsultingCompanyEmpDto.updateConsultingCompanyEmpDto;
        break;

      case EmployerRole.HIGH_SCHOOL:
        Model = HighSchoolEmp;
        DtoValidator = HighSchoolEmpDto.updateHighSchoolEmpDto;
        break;

      case EmployerRole.PROFESSIONAL_CLUB:
        Model = ProfessionalClubEmp;
        DtoValidator = ProfessionalClubEmpDto.updateProfessionalClubEmpDto;
        break;

      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid employer role: ${user.role}`
        );
    }
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Admin users cannot have profiles"
    );
  }

  // Validate profile data with update DTO
  validatedData = DtoValidator.parse(profileData);

  // Update profile in the appropriate model
  const updatedProfile = await Model.findByIdAndUpdate(
    user.profileId,
    validatedData,
    { new: true, runValidators: true }
  );

  if (!updatedProfile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  // AI Video Scoring: re-score when videos are updated for staff roles
  if (
    videoFiles.length > 0 &&
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF)
  ) {
    try {
      const scoreResult = await scoreStaffVideosFromUpload({
        videoFiles,
        role: user.role as CandidateRole,
        position: updatedProfile.position,
      });
      if (scoreResult.totalScore > 0) {
        updatedProfile.AiVideoVideoScore = scoreResult.totalScore;
        await updatedProfile.save();
      }
    } catch (scoringError) {
      logger.error("AI video re-scoring failed (non-blocking):", { error: scoringError });
    }
  }

  // Update profile image if provided
  if (profileImage) {
    // Delete old profile image if exists
    if (user.profileImage) {
      unlinkFileSync(user.profileImage);
    }
    userUpdateData.profileImage = profileImage;
  }

  // Update banner image if provided
  if (bannerImage) {
    // Delete old banner image if exists
    if (user.bannerImage) {
      unlinkFileSync(user.bannerImage);
    }
    userUpdateData.bannerImage = bannerImage;
  }

  // AI Profile Re-scoring for all candidates on profile update (non-blocking)
  if (user.userType === "candidate") {
    try {
      const profileDataForScoring = updatedProfile.toObject
        ? updatedProfile.toObject()
        : updatedProfile;
      const profileScore = await generateProfileScore(
        profileDataForScoring,
        user.role as CandidateRole
      );
      if (profileScore > 0) {
        userUpdateData.aiProfileScore = profileScore;
      }
    } catch (scoringError) {
      logger.error("AI profile re-scoring failed (non-blocking):", { error: scoringError });
    }
  }

  // Update user if there are changes
  if (Object.keys(userUpdateData).length > 0) {
    const result = await User.findByIdAndUpdate(userId, userUpdateData, {
      new: true,
    });
    if (!result) {
      throw new AppError(StatusCodes.NOT_FOUND, "User not found during update");
    }
  }

  // Get final updated user
  const updatedUser = await User.findById(userId);
  if (!updatedUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return {
    user: updatedUser,
    profile: updatedProfile,
  };
};

const updateProfileVideo = async (payload: {
  userId: string;
  videoIndex: number;
  videoFile: Express.Multer.File;
  videoTitle?: string;
  videoCategory?: string;
  position?: string;
}) => {
  const { userId, videoIndex, videoFile, videoTitle, videoCategory, position } =
    payload;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user has a profile
  if (!user.profileId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not have a profile");
  }

  let Model: any;
  let isStaff = false;

  // Determine the model based on user role
  if (user.userType === "candidate") {
    switch (user.role) {
      case CandidateRole.AMATEUR_PLAYER:
        Model = AmateurPlayerCan;
        break;
      case CandidateRole.PROFESSIONAL_PLAYER:
        Model = ProfessionalPlayerCan;
        break;
      case CandidateRole.ON_FIELD_STAFF:
        Model = OnFieldStaffCan;
        isStaff = true;
        break;
      case CandidateRole.HIGH_SCHOOL:
        Model = HighSchoolCan;
        break;
      case CandidateRole.COLLEGE_UNIVERSITY:
        Model = CollegeOrUniversity;
        break;
      case CandidateRole.OFFICE_STAFF:
        Model = OfficeStaffCan;
        isStaff = true;
        break;
      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid candidate role: ${user.role}`
        );
    }
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only candidates can have videos"
    );
  }

  // Get current profile
  const profile = await Model.findById(user.profileId);
  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  // Check if video index is valid
  if (!profile.videos || videoIndex >= profile.videos.length) {
    await cleanupUploadedFiles([videoFile]);
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Video index ${videoIndex} does not exist. Profile has ${
        profile.videos?.length || 0
      } videos`
    );
  }

  // Get the old video to delete
  const oldVideo = profile.videos[videoIndex];

  // Process the new video
  let newVideoData: any;

  if (isStaff) {
    // Staff video processing
    if (!videoTitle) {
      await cleanupUploadedFiles([videoFile]);
      throw new AppError(StatusCodes.BAD_REQUEST, "Video title is required");
    }

    const videoMeta = [
      {
        type: (videoCategory || oldVideo.videoType) as VideoType,
        title: videoTitle,
      },
    ];

    const processedVideos = await processVideos([videoFile], videoMeta);
    newVideoData = processedVideos[0];
  } else {
    // Player video processing
    const titles = [videoTitle || oldVideo.title || "Video"];
    const processedVideos = await processPlayerVideos([videoFile], titles);
    newVideoData = processedVideos[0];
  }

  // Delete old video file
  if (oldVideo.url) {
    unlinkFileSync(oldVideo.url);
  }

  // Update the video at the specified index
  profile.videos[videoIndex] = newVideoData;

  // Re-score AI video if staff role (before save to avoid double write)
  if (
    isStaff &&
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF)
  ) {
    try {
      const videoUrls = profile.videos.map((v: any) => v.url);
      const scoreResult = await scoreStaffVideosFromStored({
        videoUrls,
        role: user.role as CandidateRole,
        position: profile.position,
      });
      if (scoreResult.totalScore > 0) {
        profile.AiVideoVideoScore = scoreResult.totalScore;
      }
    } catch (scoringError) {
      logger.error("AI video re-scoring failed (non-blocking):", { error: scoringError });
    }
  }

  // Save the updated profile (single write with video + score)
  await profile.save();

  return {
    profile,
    videoIndex,
    updatedVideo: newVideoData,
  };
};

const addProfileVideo = async (payload: {
  userId: string;
  videoFile: Express.Multer.File;
  videoTitle?: string;
  videoCategory?: string;
  position?: string;
}) => {
  const { userId, videoFile, videoTitle, videoCategory, position } = payload;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user has a profile
  if (!user.profileId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not have a profile");
  }

  let Model: any;
  let isStaff = false;

  // Determine the model based on user role
  if (user.userType === "candidate") {
    switch (user.role) {
      case CandidateRole.AMATEUR_PLAYER:
        Model = AmateurPlayerCan;
        break;
      case CandidateRole.PROFESSIONAL_PLAYER:
        Model = ProfessionalPlayerCan;
        break;
      case CandidateRole.ON_FIELD_STAFF:
        Model = OnFieldStaffCan;
        isStaff = true;
        break;
      case CandidateRole.HIGH_SCHOOL:
        Model = HighSchoolCan;
        break;
      case CandidateRole.COLLEGE_UNIVERSITY:
        Model = CollegeOrUniversity;
        break;
      case CandidateRole.OFFICE_STAFF:
        Model = OfficeStaffCan;
        isStaff = true;
        break;
      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid candidate role: ${user.role}`
        );
    }
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only candidates can have videos"
    );
  }

  // Get current profile
  const profile = await Model.findById(user.profileId);
  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  // Process the new video
  let newVideoData: any;

  if (isStaff) {
    // Staff video processing
    if (!videoTitle || !videoCategory) {
      await cleanupUploadedFiles([videoFile]);
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Video title and category are required for staff"
      );
    }

    const videoMeta = [
      {
        type: videoCategory as VideoType,
        title: videoTitle,
      },
    ];

    const processedVideos = await processVideos([videoFile], videoMeta);
    newVideoData = processedVideos[0];
  } else {
    // Player video processing
    if (!videoTitle) {
      await cleanupUploadedFiles([videoFile]);
      throw new AppError(StatusCodes.BAD_REQUEST, "Video title is required");
    }

    const titles = [videoTitle];
    const processedVideos = await processPlayerVideos([videoFile], titles);
    newVideoData = processedVideos[0];
  }

  // Delete old videos from filesystem
  if (profile.videos && profile.videos.length > 0) {
    profile.videos.forEach((video: any) => {
      if (video.url) {
        unlinkFileSync(video.url);
      }
    });
  }

  // Replace all videos with the new video
  profile.videos = [newVideoData];

  // Re-score AI video if staff role (before save to avoid double write)
  if (
    isStaff &&
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF)
  ) {
    try {
      const videoUrls = profile.videos.map((v: any) => v.url);
      const scoreResult = await scoreStaffVideosFromStored({
        videoUrls,
        role: user.role as CandidateRole,
        position: profile.position,
      });
      if (scoreResult.totalScore > 0) {
        profile.AiVideoVideoScore = scoreResult.totalScore;
      }
    } catch (scoringError) {
      logger.error("AI video re-scoring failed (non-blocking):", { error: scoringError });
    }
  }

  // Save the updated profile (single write with video + score)
  await profile.save();

  return {
    profile,
    newVideo: newVideoData,
    totalVideos: profile.videos.length,
  };
};

const deleteProfileVideo = async (payload: {
  userId: string;
  videoIndex: number;
}) => {
  const { userId, videoIndex } = payload;

  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user has a profile
  if (!user.profileId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not have a profile");
  }

  let Model: any;

  // Determine the model based on user role
  if (user.userType === "candidate") {
    switch (user.role) {
      case CandidateRole.AMATEUR_PLAYER:
        Model = AmateurPlayerCan;
        break;
      case CandidateRole.PROFESSIONAL_PLAYER:
        Model = ProfessionalPlayerCan;
        break;
      case CandidateRole.ON_FIELD_STAFF:
        Model = OnFieldStaffCan;
        break;
      case CandidateRole.HIGH_SCHOOL:
        Model = HighSchoolCan;
        break;
      case CandidateRole.COLLEGE_UNIVERSITY:
        Model = CollegeOrUniversity;
        break;
      case CandidateRole.OFFICE_STAFF:
        Model = OfficeStaffCan;
        break;
      default:
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Invalid candidate role: ${user.role}`
        );
    }
  } else {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only candidates can have videos"
    );
  }

  // Get current profile
  const profile = await Model.findById(user.profileId);
  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile not found");
  }

  // Check if video index is valid
  if (!profile.videos || videoIndex >= profile.videos.length) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Video index ${videoIndex} does not exist. Profile has ${
        profile.videos?.length || 0
      } videos`
    );
  }

  // Get the video to delete
  const videoToDelete = profile.videos[videoIndex];

  // Delete video file from filesystem
  if (videoToDelete.url) {
    unlinkFileSync(videoToDelete.url);
  }

  // Remove the video from the array
  profile.videos.splice(videoIndex, 1);

  // Save the updated profile
  await profile.save();

  // Re-score AI video if staff role and videos remain
  if (
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF) &&
    profile.videos.length > 0
  ) {
    try {
      const videoUrls = profile.videos.map((v: any) => v.url);
      const scoreResult = await scoreStaffVideosFromStored({
        videoUrls,
        role: user.role as CandidateRole,
        position: profile.position,
      });
      profile.AiVideoVideoScore = scoreResult.totalScore;
      await profile.save();
    } catch (scoringError) {
      logger.error("AI video re-scoring failed (non-blocking):", { error: scoringError });
    }
  } else if (
    (user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF) &&
    profile.videos.length === 0
  ) {
    // No videos left — reset score
    profile.AiVideoVideoScore = null;
    await profile.save();
  }

  return {
    profile,
    deletedVideoIndex: videoIndex,
    remainingVideos: profile.videos.length,
  };
};

export const UserServices = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  addUserProfile,
  updateUserProfile,
  updateProfileVideo,
  addProfileVideo,
  deleteProfileVideo,
};
