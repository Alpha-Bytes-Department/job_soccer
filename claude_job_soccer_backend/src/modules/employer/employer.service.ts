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

  if (users.length === 0) {
    return {
      result: [],
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPage: 0,
      },
    };
  }

  // Get followed employer IDs for authenticated users (single query)
  const followedIdSet = new Set<string>();
  if (userId) {
    const followedEmployerIds = await Follow.find({ 
      followerId: new Types.ObjectId(userId) 
    })
      .select("followingId")
      .lean()
      .exec();
    followedEmployerIds.forEach((f) => followedIdSet.add(f.followingId.toString()));
  }

  // Group users by role to batch profile fetches
  const usersByRole = new Map<EmployerRole, any[]>();
  users.forEach((user) => {
    const role = user.role as EmployerRole;
    if (!usersByRole.has(role)) {
      usersByRole.set(role, []);
    }
    usersByRole.get(role)!.push(user);
  });

  // Fetch all profiles grouped by role in parallel
  const profilePromises = Array.from(usersByRole.entries()).map(
    async ([role, roleUsers]) => {
      const employerModel = getEmployerModel(role);
      const profileIds = roleUsers.map((u) => u.profileId);
      const profiles = await employerModel
        .find({ _id: { $in: profileIds } })
        .lean();
      return profiles;
    }
  );

  const allProfiles = (await Promise.all(profilePromises)).flat();

  // Create profile map for O(1) lookup
  const profileMap = new Map(
    allProfiles.map((p: any) => [p._id.toString(), p])
  );

  // Get all user IDs for batch counting
  const userIds = users.map((u) => u._id);

  // Pre-count jobs and followers for all users in parallel
  const [jobCounts, followerCounts] = await Promise.all([
    Job.aggregate([
      {
        $match: {
          "creator.creatorId": { $in: userIds },
          status: "active",
        },
      },
      {
        $group: {
          _id: "$creator.creatorId",
          count: { $sum: 1 },
        },
      },
    ]),
    Follow.aggregate([
      {
        $match: {
          followingId: { $in: userIds },
        },
      },
      {
        $group: {
          _id: "$followingId",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Convert to Maps for O(1) lookup
  const jobCountMap = new Map(
    jobCounts.map((j: any) => [j._id.toString(), j.count])
  );
  const followerCountMap = new Map(
    followerCounts.map((f: any) => [f._id.toString(), f.count])
  );

  // Construct employer data with pre-fetched profiles and counts
  const employersWithProfiles = users
    .map((user) => {
      const profile = profileMap.get(user.profileId);

      // Filter by country if specified
      if (country && profile && (profile as any).country !== country) {
        return null;
      }

      const userId = user._id.toString();

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        userType: user.userType,
        profile,
        activeJobCount: jobCountMap.get(userId) || 0,
        followerCount: followerCountMap.get(userId) || 0,
        isFollowing: followedIdSet.has(userId),
      };
    })
    .filter((employer) => employer !== null);

  // Count total for pagination
  const total = await User.countDocuments(userQuery);
  const totalPage = Math.ceil(total / Number(limit));

  return {
    result: employersWithProfiles,
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

  // Get followed employer IDs for authenticated users (single query)
  const followedIdSet = new Set<string>();
  if (userId) {
    const followedEmployerIds = await Follow.find({ 
      followerId: new Types.ObjectId(userId) 
    })
      .select("followingId")
      .lean()
      .exec();
    followedEmployerIds.forEach((f) => followedIdSet.add(f.followingId.toString()));
  }

  // Pre-count jobs and followers for all employers in parallel
  const [jobCounts, followerCounts] = await Promise.all([
    Job.aggregate([
      {
        $match: {
          status: "active",
          "creator.creatorId": { $exists: true },
        },
      },
      {
        $group: {
          _id: "$creator.creatorId",
          count: { $sum: 1 },
        },
      },
    ]),
    Follow.aggregate([
      {
        $group: {
          _id: "$followingId",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Convert to Maps for O(1) lookup
  const jobCountMap = new Map(
    jobCounts.map((j: any) => [j._id.toString(), j.count])
  );
  const followerCountMap = new Map(
    followerCounts.map((f: any) => [f._id.toString(), f.count])
  );

  const featuredEmployers: Record<string, any[]> = {};

  // Process all categories in parallel
  const results = await Promise.all(
    categories.map(async (category) => {
      // Get top 4 employers from each category
      const users = await User.find({
        userType: "employer",
        role: category,
        isDeleted: { $ne: true },
        profileId: { $exists: true, $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean();

      if (users.length === 0) {
        return { category, employers: [] };
      }

      // Get employer model for this category
      const employerModel = getEmployerModel(category);

      // Fetch all profiles for this category in one query
      const profileIds = users.map((u) => u.profileId);
      const profiles = await employerModel
        .find({ _id: { $in: profileIds } })
        .lean();

      // Create profile map for O(1) lookup
      const profileMap = new Map(
        profiles.map((p: any) => [p._id.toString(), p])
      );

      // Construct employer data with pre-fetched counts
      const employersWithProfiles = users.map((user) => {
        const userId = user._id.toString();
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          userType: user.userType,
          profile: profileMap.get(user.profileId),
          activeJobCount: jobCountMap.get(userId) || 0,
          followerCount: followerCountMap.get(userId) || 0,
          isFollowing: followedIdSet.has(userId),
        };
      });

      return { category, employers: employersWithProfiles };
    })
  );

  // Convert results array to object with category keys
  results.forEach(({ category, employers }) => {
    const categoryKey = category.replace(/\s+/g, "").replace(/\//g, "");
    featuredEmployers[categoryKey] = employers;
  });

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

  // Check if authenticated user is following this employer and get follower count
  const [isFollowing, followerCount] = await Promise.all([
    userId
      ? Follow.exists({
          followerId: new Types.ObjectId(userId),
          followingId: new Types.ObjectId(id),
        }).then((result) => !!result)
      : Promise.resolve(false),
    Follow.countDocuments({
      followingId: new Types.ObjectId(id),
    }),
  ]);

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
    followerCount,
  };
};

export const EmployerServices = {
  searchEmployers,
  getFeaturedEmployers,
  getEmployerById,
};
