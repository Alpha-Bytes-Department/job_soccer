import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { AdminVerification } from "./adminVerification.model";
import { TAdminVerification, VerificationStatus } from "./adminVerification.interface";
import { User } from "../user/user.model";
import { UserType } from "../user/user.interface";
import { CandidateEducation } from "../candidateEducation/candidateEducation.model";
import { CandidateExperience } from "../candidateExperience/candidateExperience.model";
import { CandidateLicenseAndCertification } from "../candidateLicensesAndCertification/candidateLicensesAndCertification.model";
import { QueryBuilder } from "../../shared/builder/QueryBuilder";
import { adminVerificationCache } from "./adminVerification.cache";

/**
 * Request verification for a user (candidate or employer)
 */
const requestVerification = async (userId: string): Promise<TAdminVerification> => {
  // Check if user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Check if user is candidate or employer
  if (user.userType === UserType.ADMIN) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Admins cannot request verification"
    );
  }

  // Check if verification request already exists
  const existingRequest = await AdminVerification.findOne({ userId });
  if (existingRequest) {
    if (existingRequest.status === VerificationStatus.PENDING) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Verification request already pending"
      );
    }
    if (existingRequest.status === VerificationStatus.APPROVED) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "User is already verified"
      );
    }
    // If rejected, allow to create a new request
    await AdminVerification.deleteOne({ userId });
  }

  // Create new verification request
  const verificationRequest = await AdminVerification.create({
    userId,
    userType: user.userType,
    status: VerificationStatus.PENDING,
  });

  // Invalidate cache after creating new request
  await adminVerificationCache.invalidateUserCache(userId);

  return verificationRequest;
};

/**
 * Get all verification requests with filters
 */
const getVerificationRequests = async (query: any) => {
  const searchableFields: string[] = [];
  const verificationQuery = new QueryBuilder(
    AdminVerification.find()
      .populate("userId", "firstName lastName email role profileImage profileId")
      .populate("verifiedBy", "firstName lastName email"),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await verificationQuery.modelQuery;
  const meta = await verificationQuery.countTotal();

  return {
    result,
    meta,
  };
};

/**
 * Get verification request by ID with full user details
 */
const getVerificationById = async (verificationId: string) => {
  const verification = await AdminVerification.findById(verificationId)
    .populate("userId", "firstName lastName email role profileImage profileId userType")
    .populate("verifiedBy", "firstName lastName email");

  if (!verification) {
    throw new AppError(StatusCodes.NOT_FOUND, "Verification request not found");
  }

  const userId = verification.userId._id.toString();
  const userType = (verification.userId as any).userType;

  // Initialize the response object
  const response: any = {
    verification,
    userDetails: verification.userId,
  };

  // If user is a candidate, fetch education, experience, and certifications
  if (userType === UserType.CANDIDATE) {
    const [educations, experiences, certifications] = await Promise.all([
      CandidateEducation.find({ userId }).sort({ startYear: -1 }),
      CandidateExperience.find({ userId }).sort({ startYear: -1 }),
      CandidateLicenseAndCertification.find({ userId }).sort({ createdAt: -1 }),
    ]);

    response.educations = educations;
    response.experiences = experiences;
    response.certifications = certifications;
  }

  // If user is an employer, you can add employer-specific data here
  // For now, we'll just return the basic verification and user details

  return response;
};

/**
 * Update verification status (approve or reject)
 */
const updateVerificationStatus = async (
  verificationId: string,
  adminId: string,
  status: "approved" | "rejected"
): Promise<TAdminVerification> => {
  // Check if verification request exists
  const verification = await AdminVerification.findById(verificationId);
  if (!verification) {
    throw new AppError(StatusCodes.NOT_FOUND, "Verification request not found");
  }

  // Check if already processed
  if (verification.status !== VerificationStatus.PENDING) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Verification request is already ${verification.status}`
    );
  }

  // Update verification status
  const updateData: any = {
    status,
    verifiedBy: adminId,
    verifiedAt: new Date(),
  };

  const updatedVerification = await AdminVerification.findByIdAndUpdate(
    verificationId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate("userId", "firstName lastName email role")
    .populate("verifiedBy", "firstName lastName email");

  if (!updatedVerification) {
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to update verification status"
    );
  }

  // Update user's isVerified status
  if (status === "approved") {
    await User.findByIdAndUpdate(verification.userId, { isVerified: true });
  }

  // Invalidate cache after updating status
  await adminVerificationCache.invalidateUserCache(verification.userId.toString());
  await adminVerificationCache.invalidateVerificationCache(verificationId);

  return updatedVerification;
};

/**
 * Get user's verification status
 */
const getUserVerificationStatus = async (userId: string) => {
  const cacheKey = adminVerificationCache.getCacheKey.statusByUser(userId);

  // Try to get from cache
  type VerificationStatusResponse = {
    hasRequest: boolean;
    status: string | null;
    verifiedAt: Date | null | undefined;
    createdAt?: Date;
  };
  const cachedData = await adminVerificationCache.getCache<VerificationStatusResponse>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const verification = await AdminVerification.findOne({ userId });
  
  let result: VerificationStatusResponse;
  if (!verification) {
    result = {
      hasRequest: false,
      status: null,
      verifiedAt: null,
    };
  } else {
    result = {
      hasRequest: true,
      status: verification.status,
      verifiedAt: verification.verifiedAt || null,
      createdAt: verification.createdAt,
    };
  }

  // Cache the result
  await adminVerificationCache.setCache(cacheKey, result, adminVerificationCache.CACHE_TTL);

  return result;
};

export const AdminVerificationService = {
  requestVerification,
  getVerificationRequests,
  getVerificationById,
  updateVerificationStatus,
  getUserVerificationStatus,
};
