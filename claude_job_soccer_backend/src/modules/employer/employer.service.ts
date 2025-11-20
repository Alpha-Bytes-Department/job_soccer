import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { EmployerRole } from "../user/user.interface";
import { SearchHistoryService, SearchEntityType } from "../searchHistory/searchHistory.service";
import { Types } from "mongoose";

// Import Employer Models
import { AcademyEmp } from "./academyEmp/academyEmp.model";
import { AgentEmp } from "./agentEmp/agentEmp.model";
import { AmateurClubEmp } from "./amateurClubEmp/amateurClubEmp.model";
import { CollegeOrUniversityEmp } from "./collegeOrUniversityEmp/collegeOrUniversityEmp.model";
import { ConsultingCompanyEmp } from "./consultingCompanyEmp/consultingCompanyEmp.model";
import { HighSchoolEmp } from "./highSchoolEmp/highSchoolEmp.model";
import { ProfessionalClubEmp } from "./professionalClubEmp/professionalClubEmp.model";

// Import model for filtering
import { Follow } from "../follow/follow.model";

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
 * SEMI-PRIVATE: When authenticated, hides employers followed by the user (one-way)
 * 
 * @param query - Query parameters for filtering
 * @param userId - Optional user ID for authenticated filtering
 */
const searchEmployers = async (query: Record<string, unknown>, userId?: string) => {
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
    await SearchHistoryService.recordSearch(SearchEntityType.EMPLOYER, searchTerm as string);
  }

  // Build base user query for employers only
  let userQuery: any = {
    userType: "employer",
    isDeleted: { $ne: true },
    profileId: { $exists: true, $ne: null }, // Only users with profiles
  };

  // SEMI-PRIVATE FILTERING: Hide employers followed by the user (one-way)
  if (userId) {
    const followedEmployers = await Follow.find({
      followerId: new Types.ObjectId(userId),
    })
      .select("followingId")
      .lean()
      .exec();

    // Add exclusion filter if there are employers to exclude
    if (followedEmployers.length > 0) {
      const excludeEmployerIds = followedEmployers.map(f => f.followingId);
      userQuery._id = { $nin: excludeEmployerIds };
    }
  }

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

  // Fetch profile details for each user
  const employersWithProfiles = await Promise.all(
    users.map(async (user) => {
      const employerModel = getEmployerModel(user.role as EmployerRole);
      let profile = await employerModel.findById(user.profileId).lean();

      // Filter by country if specified
      if (country && profile && (profile as any).country !== country) {
        return null;
      }

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        userType: user.userType,
        profile,
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
 */
const getFeaturedEmployers = async () => {
  const categories = [
    EmployerRole.PROFESSIONAL_CLUB,
    EmployerRole.ACADEMY,
    EmployerRole.AMATEUR_CLUB,
    EmployerRole.CONSULTING_COMPANY,
    EmployerRole.HIGH_SCHOOL,
    EmployerRole.COLLEGE_UNIVERSITY,
    EmployerRole.AGENT,
  ];

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

          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            userType: user.userType,
            profile,
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
 */
const getEmployerById = async (id: string) => {
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
  };
};

export const EmployerServices = {
  searchEmployers,
  getFeaturedEmployers,
  getEmployerById,
};
