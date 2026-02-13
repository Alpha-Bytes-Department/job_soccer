import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import { CandidateRole } from "../user/user.interface";
import {
  SearchHistoryService,
  SearchEntityType,
} from "../searchHistory/searchHistory.service";
import { Types } from "mongoose";

// Import models for filtering
import { CandidateShortList } from "../candidateShortList/candidateShortList.model";
import { FriendList } from "../friendlist/friendlist.model";
import { getCandidateModel } from "../../shared/util/getCandidateModel";

/**
 * Search candidates by name, category, and country
 * Supports pagination, sorting, and filtering
 * When authenticated, includes relationship fields:
 * 1. isShortlisted - Whether the candidate is shortlisted by the current user
 * 2. friendRequestStatus - Friend request status and type (sent/received) from user's perspective
 *
 * @param query - Query parameters for filtering
 * @param userId - Optional user ID for authenticated user context
 */
const searchCandidates = async (
  query: Record<string, unknown>,
  userId?: string
) => {
  const { searchTerm, role, country, page = 1, limit = 10 } = query;

  // Record search term for history tracking
  if (searchTerm) {
    await SearchHistoryService.recordSearch(
      SearchEntityType.CANDIDATE,
      searchTerm as string
    );
  }

  // Build base user query for candidates only
  let userQuery: any = {
    userType: "candidate",
    isDeleted: { $ne: true },
    profileId: { $exists: true, $ne: null }, // Only users with profiles
    _id: { $ne: userId ? new Types.ObjectId(userId) : undefined }, // Exclude self if authenticated
  };

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
    .lean();

  // Batch fetch relationship data for performance (only if user is authenticated)
  let shortlistMap = new Map<string, boolean>();
  let friendRequestMap = new Map<
    string,
    { status: string; type: "sent" | "received" }
  >();

  if (userId && users.length > 0) {
    const userIds = users.map((u) => u._id);

    // Batch fetch shortlist data
    const shortlisted = await CandidateShortList.find({
      shortlistedById: new Types.ObjectId(userId),
      candidateId: { $in: userIds },
    })
      .select("candidateId")
      .lean();

    shortlisted.forEach((item) => {
      shortlistMap.set(item.candidateId.toString(), true);
    });

    // Batch fetch friend request data
    const friendRequests = await FriendList.find({
      $or: [
        { senderId: new Types.ObjectId(userId), receiverId: { $in: userIds } },
        { receiverId: new Types.ObjectId(userId), senderId: { $in: userIds } },
      ],
    })
      .select("senderId receiverId status")
      .lean();

    friendRequests.forEach((fr) => {
      const isSender = fr.senderId.toString() === userId;
      const otherUserId = isSender
        ? fr.receiverId.toString()
        : fr.senderId.toString();

      friendRequestMap.set(otherUserId, {
        status: fr.status,
        type: isSender ? "sent" : "received",
      });
    });
  }

  // Fetch profile details for each user with relationship fields
  const candidatesWithProfiles = await Promise.all(
    users.map(async (user) => {
      const candidateModel = getCandidateModel(user.role as CandidateRole);
      let profile = await candidateModel.findById(user.profileId).lean();

      // Filter by country if specified
      if (country && profile && (profile as any).country !== country) {
        return null;
      }

      const userId_str = user._id.toString();

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        userType: user.userType,
        profile,
        // Relationship fields (only present when user is authenticated)
        ...(userId && {
          isShortlisted: shortlistMap.get(userId_str) || false,
          friendRequestStatus: friendRequestMap.get(userId_str) || null,
        }),
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
 * When authenticated, includes relationship fields for each candidate
 */
const getFeaturedCandidates = async (userId?: string) => {
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
        _id: { $ne: userId ? new Types.ObjectId(userId) : undefined }, // Exclude self if authenticated
      })
        .limit(4)
        .lean();

      // Batch fetch relationship data for performance (only if user is authenticated)
      let shortlistMap = new Map<string, boolean>();
      let friendRequestMap = new Map<
        string,
        { status: string; type: "sent" | "received" }
      >();

      if (userId && users.length > 0) {
        const userIds = users.map((u) => u._id);

        // Batch fetch shortlist data
        const shortlisted = await CandidateShortList.find({
          shortlistedById: new Types.ObjectId(userId),
          candidateId: { $in: userIds },
        })
          .select("candidateId")
          .lean();

        shortlisted.forEach((item) => {
          shortlistMap.set(item.candidateId.toString(), true);
        });

        // Batch fetch friend request data
        const friendRequests = await FriendList.find({
          $or: [
            {
              senderId: new Types.ObjectId(userId),
              receiverId: { $in: userIds },
            },
            {
              receiverId: new Types.ObjectId(userId),
              senderId: { $in: userIds },
            },
          ],
        })
          .select("senderId receiverId status")
          .lean();

        friendRequests.forEach((fr) => {
          const isSender = fr.senderId.toString() === userId;
          const otherUserId = isSender
            ? fr.receiverId.toString()
            : fr.senderId.toString();

          friendRequestMap.set(otherUserId, {
            status: fr.status,
            type: isSender ? "sent" : "received",
          });
        });
      }

      // Fetch profile details for each user with relationship fields
      const candidatesWithProfiles = await Promise.all(
        users.map(async (user) => {
          const candidateModel = getCandidateModel(user.role as CandidateRole);
          const profile = await candidateModel.findById(user.profileId).lean();

          const userId_str = user._id.toString();

          return {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            userType: user.userType,
            profile,
            // Relationship fields (only present when user is authenticated)
            ...(userId && {
              isShortlisted: shortlistMap.get(userId_str) || false,
              friendRequestStatus: friendRequestMap.get(userId_str) || null,
            }),
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
 * When authenticated, includes relationship fields
 */
const getCandidateById = async (id: string, userId?: string) => {
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

  // Fetch relationship data if user is authenticated
  let isShortlisted = false;
  let friendRequestStatus: {
    status: string;
    type: "sent" | "received";
  } | null = null;

  if (userId) {
    // Check if shortlisted
    const shortlist = await CandidateShortList.findOne({
      shortlistedById: new Types.ObjectId(userId),
      candidateId: user._id,
    }).lean();

    isShortlisted = !!shortlist;

    // Check friend request status
    const friendRequest = await FriendList.findOne({
      $or: [
        { senderId: new Types.ObjectId(userId), receiverId: user._id },
        { receiverId: new Types.ObjectId(userId), senderId: user._id },
      ],
    })
      .select("senderId receiverId status")
      .lean();

    if (friendRequest) {
      const isSender = friendRequest.senderId.toString() === userId;
      friendRequestStatus = {
        status: friendRequest.status,
        type: isSender ? "sent" : "received",
      };
    }
  }
    if (
      user.role === CandidateRole.ON_FIELD_STAFF ||
      user.role === CandidateRole.OFFICE_STAFF
    ) {
      // AiVideoVideoScore is now computed by AI during video upload
      profile.AiVideoVideoScore = profile.AiVideoVideoScore ?? null;
    }

  return {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    //TODO AI Profile Score
       aiProfileScore: user?.aiProfileScore || 90,
    profileImage: user.profileImage,
    userType: user.userType,
    isVerified: user.isVerified,
    profile,
    // Relationship fields (only present when user is authenticated)
    ...(userId && {
      isShortlisted,
      friendRequestStatus,
    }),
  };
};

export const CandidateServices = {
  searchCandidates,
  getFeaturedCandidates,
  getCandidateById,
};
