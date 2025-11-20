import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { CandidateRole } from "../user/user.interface";
import { SearchHistoryService, SearchEntityType } from "../searchHistory/searchHistory.service";
import { Types } from "mongoose";

// Import Candidate Models
import { AmateurPlayerCan } from "./amateurPlayerCan/amateurPlayerCan.model";
import { ProfessionalPlayerCan } from "./professionalPlayerCan/professionalPlayerCan.model";
import { OnFieldStaffCan } from "./onFieldStaffCan/onFieldStaffCan.model";
import { OfficeStaffCan } from "./officeStaffCan/officeStaffCan.model";
import { HighSchoolCan } from "./highSchoolCan/highSchoolCan.model";
import { CollegeOrUniversity } from "./collegeOrUniversityCan/collegeOrUniversityCan.model";

// Import models for filtering
import { CandidateShortList } from "../candidateShortList/candidateShortList.model";
import { FriendList } from "../friendlist/friendlist.model";

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
 * Search candidates by name, category, and country
 * Supports pagination, sorting, and filtering
 * SEMI-PRIVATE: When authenticated, applies custom hide logic:
 * 1. Hide candidates shortlisted by the user (one-way)
 * 2. Hide candidates with any friend request interaction (two-way)
 * 
 * @param query - Query parameters for filtering
 * @param userId - Optional user ID for authenticated filtering
 */
const searchCandidates = async (query: Record<string, unknown>, userId?: string) => {
  const {
    searchTerm,
    role,
    country,
    page = 1,
    limit = 10,
  } = query;

  // Record search term for history tracking
  if (searchTerm) {
    await SearchHistoryService.recordSearch(SearchEntityType.CANDIDATE, searchTerm as string);
  }

  // Build base user query for candidates only
  let userQuery: any = {
    userType: "candidate",
    isDeleted: { $ne: true },
    profileId: { $exists: true, $ne: null }, // Only users with profiles
  };

  // SEMI-PRIVATE FILTERING: Apply when user is authenticated
  if (userId) {
    const excludeUserIds: Types.ObjectId[] = [];

    // 1. Get candidates shortlisted by this user (one-way hide)
    const shortlistedCandidates = await CandidateShortList.find({
      shortlistedById: new Types.ObjectId(userId),
    })
      .select("candidateId")
      .lean()
      .exec();

    excludeUserIds.push(...shortlistedCandidates.map(s => s.candidateId));

    // 2. Get candidates with friend request interactions (two-way hide)
    // This includes: sent, received, pending, accepted, rejected
    const friendListInteractions = await FriendList.find({
      $or: [
        { senderId: new Types.ObjectId(userId) },
        { receiverId: new Types.ObjectId(userId) },
      ],
    })
      .select("senderId receiverId")
      .lean()
      .exec();

    // Add both sender and receiver IDs (excluding the current user)
    for (const interaction of friendListInteractions) {
      if (interaction.senderId.toString() !== userId) {
        excludeUserIds.push(interaction.senderId);
      }
      if (interaction.receiverId.toString() !== userId) {
        excludeUserIds.push(interaction.receiverId);
      }
    }

    // Add exclusion filter if there are users to exclude
    if (excludeUserIds.length > 0) {
      // Remove duplicates
      const uniqueExcludeIds = [...new Set(excludeUserIds.map(id => id.toString()))];
      userQuery._id = { $nin: uniqueExcludeIds.map(id => new Types.ObjectId(id)) };
    }
  }

  // Filter by candidate role/category if provided
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
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit))
    .lean()

  // Fetch profile details for each user
  const candidatesWithProfiles = await Promise.all(
    users.map(async (user) => {
      const candidateModel = getCandidateModel(user.role as CandidateRole);
      let profile = await candidateModel.findById(user.profileId).lean();

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

  // Filter out null values (candidates that didn't match country filter)
  const filteredCandidates = candidatesWithProfiles.filter(
    (candidate) => candidate !== null
  );

  // Count total for pagination
  const total = await User.countDocuments(userQuery);
  const totalPage = Math.ceil(total / Number(limit));

  return {
    result: filteredCandidates,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPage,
    },
  };
};

/**
 * Get featured candidates grouped by category
 * Returns max 4 candidates per category
 */
const getFeaturedCandidates = async () => {
  const categories = [
    CandidateRole.PROFESSIONAL_PLAYER,
    CandidateRole.AMATEUR_PLAYER,
    CandidateRole.HIGH_SCHOOL,
    CandidateRole.COLLEGE_UNIVERSITY,
    CandidateRole.ON_FIELD_STAFF,
    CandidateRole.OFFICE_STAFF,
  ];

  const featuredCandidates: Record<string, any[]> = {};

  await Promise.all(
    categories.map(async (category) => {
      const users = await User.find({
        userType: "candidate",
        role: category,
        isDeleted: { $ne: true },
        profileId: { $exists: true, $ne: null },
      })
        .limit(4)
        .lean();

      // Fetch profile details for each user
      const candidatesWithProfiles = await Promise.all(
        users.map(async (user) => {
          const candidateModel = getCandidateModel(user.role as CandidateRole);
          const profile = await candidateModel.findById(user.profileId).lean();

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
      const categoryKey = category.replace(/\s+/g, "");
      featuredCandidates[categoryKey] = candidatesWithProfiles;
    })
  );

  return featuredCandidates;
};

/**
 * Get candidate by ID with full profile details
 */
const getCandidateById = async (id: string) => {
  const user = await User.findById(id).lean();

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "Candidate not found");
  }

  if (user.userType !== "candidate") {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not a candidate");
  }

  if (!user.profileId) {
    throw new AppError(StatusCodes.NOT_FOUND, "Candidate profile not found");
  }

  // Get profile details
  const candidateModel = getCandidateModel(user.role as CandidateRole);
  const profile = await candidateModel.findById(user.profileId).lean();

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

export const CandidateServices = {
  searchCandidates,
  getFeaturedCandidates,
  getCandidateById,
};

