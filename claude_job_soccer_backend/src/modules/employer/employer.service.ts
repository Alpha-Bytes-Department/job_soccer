import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { EmployerRole } from "../user/user.interface";
import {
  SearchHistoryService,
  SearchEntityType,
} from "../searchHistory/searchHistory.service";
import { Types } from "mongoose";

// Import Employer Models
import { AcademyEmp } from "./academyEmp/academyEmp.model";
import { AgentEmp } from "./agentEmp/agentEmp.model";
import { AmateurClubEmp } from "./amateurClubEmp/amateurClubEmp.model";
import { CollegeOrUniversityEmp } from "./collegeOrUniversityEmp/collegeOrUniversityEmp.model";
import { ConsultingCompanyEmp } from "./consultingCompanyEmp/consultingCompanyEmp.model";
import { HighSchoolEmp } from "./highSchoolEmp/highSchoolEmp.model";
import { ProfessionalClubEmp } from "./professionalClubEmp/professionalClubEmp.model";

// Import models for filtering and counting
import { Follow } from "../follow/follow.model";
import { Job } from "../Job/job.model";

/**
 * Get employer model based on role
 */
const getEmployerModel = (role: EmployerRole): any => {
  switch (role) {
    case EmployerRole.PROFESSIONAL_CLUB:
      return ProfessionalClubEmp;
    case EmployerRole.ACADEMY:
      return AcademyEmp;
    case EmployerRole.AMATEUR_CLUB:
      return AmateurClubEmp;
    case EmployerRole.CONSULTING_COMPANY:
      return ConsultingCompanyEmp;
    case EmployerRole.HIGH_SCHOOL:
      return HighSchoolEmp;
    case EmployerRole.COLLEGE_UNIVERSITY:
      return CollegeOrUniversityEmp;
    case EmployerRole.AGENT:
      return AgentEmp;
    default:
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid employer role");
  }
};

/**
 * Search employers by name, category, and country
 * Supports pagination, sorting, and filtering
 * SEMI-PRIVATE: When authenticated, includes isFollowing field for each employer
 *
 * @param query - Query parameters for filtering
 * @param userId - Optional user ID for authenticated filtering
 */
const searchEmployers = async (
  query: Record<string, unknown>,
  userId?: string
) => {
  const {
    searchTerm,
    role,
    country,
    page = 1,
    limit = 10,
    sortBy = "-createdAt",
  } = query;

  // Record search term for history tracking
  if (searchTerm) {
    await SearchHistoryService.recordSearch(
      SearchEntityType.EMPLOYER,
      searchTerm as string
    );
  }

  // Build base user query for employers only
  let userQuery: any = {
    userType: "employer",
    isDeleted: { $ne: true },
    profileId: { $exists: true, $ne: null }, // Only users with profiles
  };

  // Filter by employer role/category if provided
  if (role) {
    userQuery.role = role;
  }

  // Search by name (firstName or lastName)
  if (searchTerm) {
    userQuery.$or = [
      { firstName: { $regex: searchTerm, $options: "i" } },
      { lastName: { $regex: searchTerm, $options: "i" } },
    ];
  }

  // Get users matching the criteria
  const users = await User.find(userQuery)
    .sort(sortBy as string)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean();

  // Get followed employer IDs for authenticated users
  const followedEmployerIds = userId
    ? await Follow.find({ followerId: new Types.ObjectId(userId) })
        .select("followingId")
        .lean()
        .exec()
    : [];

  // Create a Set for O(1) lookup performance
  const followedIdSet = new Set(
    followedEmployerIds.map((f) => f.followingId.toString())
  );

  // Fetch profile details for each user with active job count and follower count
  const employersWithProfiles = await Promise.all(
    users.map(async (user) => {
      const employerModel = getEmployerModel(user.role as EmployerRole);
      let profile = await employerModel.findById(user.profileId).lean();

      // Filter by country if specified
      if (country && profile && (profile as any).country !== country) {
        return null;
      }

      // Count active jobs posted by this employer
      const activeJobCount = await Job.countDocuments({
        "creator.creatorId": user._id,
        status: "active",
      });

      // Count followers for this employer
      const followerCount = await Follow.countDocuments({
        followingId: user._id,
      });

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        userType: user.userType,
        profile,
        activeJobCount,
        followerCount,
        isFollowing: followedIdSet.has(user._id.toString()),
      };
    })
  );

  // Filter out null values (employers that didn't match country filter)
  const filteredEmployers = employersWithProfiles.filter(
    (employer) => employer !== null
  );

  // Count total for pagination
  const total = await User.countDocuments(userQuery);
  const totalPage = Math.ceil(total / Number(limit));

  return {
    result: filteredEmployers,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage,
    },
  };
};

/**
 * Get featured employers grouped by category
 * Returns max 4 employers per category
 * SEMI-PRIVATE: When authenticated, includes isFollowing field
 * 
 * @param userId - Optional user ID for authenticated users
 */
const getFeaturedEmployers = async (userId?: string) => {
  const categories = [
    EmployerRole.PROFESSIONAL_CLUB,
    EmployerRole.ACADEMY,
    EmployerRole.AMATEUR_CLUB,
    EmployerRole.CONSULTING_COMPANY,
    EmployerRole.HIGH_SCHOOL,
    EmployerRole.COLLEGE_UNIVERSITY,
    EmployerRole.AGENT,
  ];

  // Get followed employer IDs for authenticated users
  const followedEmployerIds = userId
    ? await Follow.find({ followerId: new Types.ObjectId(userId) })
        .select("followingId")
        .lean()
        .exec()
    : [];

  // Create a Set for O(1) lookup performance
  const followedIdSet = new Set(
    followedEmployerIds.map((f) => f.followingId.toString())
  );

  const featuredEmployers: Record<string, any[]> = {};

  await Promise.all(
    categories.map(async (category) => {
      // Get top 4 employers from each category
      const users = await User.find({
        userType: "employer",
        role: category,
        isDeleted: { $ne: true },
        profileId: { $exists: true, $ne: null },
      })
        .sort({ createdAt: -1 }) // Sort by most recent
        .limit(4)
        .lean();

      // Fetch profile details for each user
      const employersWithProfiles = await Promise.all(
        users.map(async (user) => {
          const employerModel = getEmployerModel(user.role as EmployerRole);
          const profile = await employerModel.findById(user.profileId).lean();
          // Count active jobs posted by this employer
          const activeJobCount = await Job.countDocuments({
            "creator.creatorId": user._id,
            status: "active",
          });

          // Count followers for this employer
          const followerCount = await Follow.countDocuments({
            followingId: user._id,
          });
          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            userType: user.userType,
            profile,
            activeJobCount,
            followerCount,
            isFollowing: followedIdSet.has(user._id.toString()),
          };
        })
      );

      // Use a more readable key name
      const categoryKey = category.replace(/\s+/g, "").replace(/\//g, "");
      featuredEmployers[categoryKey] = employersWithProfiles;
    })
  );

  return featuredEmployers;
};

/**
 * Get employer by ID with full profile details
 * SEMI-PRIVATE: When authenticated, includes isFollowing field
 * 
 * @param id - Employer ID
 * @param userId - Optional user ID for authenticated users
 */
const getEmployerById = async (id: string, userId?: string) => {
  const user = await User.findById(id).lean();

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employer not found");
  }

  if (user.userType !== "employer") {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an employer");
  }

  if (!user.profileId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employer profile not found");
  }

  // Get profile details
  const employerModel = getEmployerModel(user.role as EmployerRole);
  const profile = await employerModel.findById(user.profileId).lean();

  if (!profile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile details not found");
  }

  // Check if authenticated user is following this employer
  const isFollowing = userId
    ? await Follow.exists({
        followerId: new Types.ObjectId(userId),
        followingId: new Types.ObjectId(id),
      }).then((result) => !!result)
    : false;

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    profileImage: user.profileImage,
    userType: user.userType,
    isVerified: user.isVerified,
    profile,
    isFollowing,
  };
};

export const EmployerServices = {
  searchEmployers,
  getFeaturedEmployers,
  getEmployerById,
};
