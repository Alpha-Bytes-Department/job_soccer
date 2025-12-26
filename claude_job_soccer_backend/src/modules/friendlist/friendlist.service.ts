import { Types } from "mongoose";
import { FriendList } from "./friendlist.model";
import { TFriendList } from "./friendlist.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { CandidateRole, EmployerRole } from "../user/user.interface";

// Import Employer Models
import { AcademyEmp } from "../employer/academyEmp/academyEmp.model";
import { AgentEmp } from "../employer/agentEmp/agentEmp.model";
import { AmateurClubEmp } from "../employer/amateurClubEmp/amateurClubEmp.model";
import { CollegeOrUniversityEmp } from "../employer/collegeOrUniversityEmp/collegeOrUniversityEmp.model";
import { ConsultingCompanyEmp } from "../employer/consultingCompanyEmp/consultingCompanyEmp.model";
import { HighSchoolEmp } from "../employer/highSchoolEmp/highSchoolEmp.model";
import { ProfessionalClubEmp } from "../employer/professionalClubEmp/professionalClubEmp.model";

// Import models for additional fields
import { CandidateShortList } from "../candidateShortList/candidateShortList.model";
import { Follow } from "../follow/follow.model";
import { Job } from "../Job/job.model";
import { getCandidateModel } from "../../shared/util/getCandidateModel";

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
 * Send a friend request
 * Both candidates and employers can send friend requests to each other
 */
const sendFriendRequest = async (
  senderId: string,
  senderType: "candidate" | "employer",
  senderRole: string,
  receiverId: string
): Promise<TFriendList> => {
  // Prevent users from sending friend request to themselves
  if (senderId === receiverId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You cannot send a friend request to yourself"
    );
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Only candidates can receive friend requests
  if (receiver.userType !== "candidate") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can only send friend requests to candidates"
    );
  }

  // Check if friend request already exists (in either direction)
  const existingRequest = await FriendList.findOne({
    $or: [
      {
        senderId: new Types.ObjectId(senderId),
        receiverId: new Types.ObjectId(receiverId),
      },
      {
        senderId: new Types.ObjectId(receiverId),
        receiverId: new Types.ObjectId(senderId),
      },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === "pending") {
      throw new AppError(
        StatusCodes.CONFLICT,
        "A friend request already exists between these users"
      );
    } else if (existingRequest.status === "accepted") {
      throw new AppError(
        StatusCodes.CONFLICT,
        "You are already friends with this user"
      );
    } else if (existingRequest.status === "rejected") {
      // Allow resending if previous request was rejected
      existingRequest.senderId = new Types.ObjectId(senderId);
      existingRequest.senderType = senderType;
      existingRequest.senderRole = senderRole as any;
      existingRequest.receiverId = new Types.ObjectId(receiverId);
      existingRequest.receiverRole = receiver.role as any;
      existingRequest.status = "pending";
      await existingRequest.save();

      const populatedRequest = await FriendList.findById(existingRequest._id)
        .populate({
          path: "receiverId",
          select: "email role userType createdAt",
        })
        .lean();

      return populatedRequest as TFriendList;
    }
  }

  // Create friend request
  const friendRequest = await FriendList.create({
    senderId: new Types.ObjectId(senderId),
    senderType,
    senderRole,
    receiverId: new Types.ObjectId(receiverId),
    receiverRole: receiver.role,
    status: "pending",
  });

  // Populate receiver details before returning
  const populatedRequest = await FriendList.findById(friendRequest._id)
    .populate({
      path: "receiverId",
      select: "email role userType createdAt",
    })
    .lean();

  return populatedRequest as TFriendList;
};

/**
 * Respond to a friend request (accept or reject)
 */
const respondToFriendRequest = async (
  userId: string,
  requestId: string,
  status: "accepted" | "rejected"
): Promise<TFriendList> => {
  // Find the friend request
  const friendRequest = await FriendList.findById(requestId);

  if (!friendRequest) {
    throw new AppError(StatusCodes.NOT_FOUND, "Friend request not found");
  }

  // Verify that the user is the receiver of the request
  if (friendRequest.receiverId.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to respond to this friend request"
    );
  }

  // Check if request is still pending
  if (friendRequest.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `This friend request has already been ${friendRequest.status}`
    );
  }

  // Update the status
  friendRequest.status = status;
  await friendRequest.save();

  // Populate both sender and receiver details
  const populatedRequest = await FriendList.findById(friendRequest._id)
    .populate({
      path: "senderId",
      select: "email role userType createdAt",
    })
    .populate({
      path: "receiverId",
      select: "email role userType createdAt",
    })
    .lean();

  return populatedRequest as TFriendList;
};

/**
 * Get all friend requests received by the user
 */
const getReceivedFriendRequests = async (
  userId: string,
  query: Record<string, any>
): Promise<{
  data: TFriendList[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {
    receiverId: new Types.ObjectId(userId),
    status: "pending",
  };

  // Get total count
  const total = await FriendList.countDocuments(filter);

  // Get paginated data
  const data = await FriendList.find(filter)
    .populate({
      path: "senderId",
      select: "email role userType createdAt firstName lastName profileImage",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as TFriendList[],
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get all friend requests sent by the user
 */
const getSentFriendRequests = async (
  userId: string,
  query: Record<string, any>
): Promise<{
  data: TFriendList[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = {
    senderId: new Types.ObjectId(userId),
    status: "pending",
  };

  // Get total count
  const total = await FriendList.countDocuments(filter);

  // Get paginated data
  const data = await FriendList.find(filter)
    .populate({
      path: "receiverId",
      select: "email role userType createdAt",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as TFriendList[],
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get all friends (accepted friend requests) for a user
 */
const getFriends = async (
  userId: string,
  query: Record<string, any>
): Promise<{
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter - user can be either sender or receiver
  const filter: any = {
    $or: [
      { senderId: new Types.ObjectId(userId), status: "accepted" },
      { receiverId: new Types.ObjectId(userId), status: "accepted" },
    ],
  };

  // Get total count
  const total = await FriendList.countDocuments(filter);

  // Get paginated friend requests
  const friendRequests = await FriendList.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get friend user IDs (excluding current user)
  const friendUserIds = friendRequests.map((request: any) => {
    return request.senderId.toString() === userId
      ? request.receiverId
      : request.senderId;
  });

  if (friendUserIds.length === 0) {
    return {
      data: [],
      meta: {
        page,
        limit,
        total,
        totalPages: 0,
      },
    };
  }

  // Fetch full user details for all friends
  const friendUsers = await User.find({
    _id: { $in: friendUserIds },
    isDeleted: { $ne: true },
  }).lean();

  // Create a map of user ID to user data
  const userMap = new Map(
    friendUsers.map((user: any) => [user._id.toString(), user])
  );

  // Prepare data structures for batch queries
  const candidateIds: Types.ObjectId[] = [];
  const employerIds: Types.ObjectId[] = [];
  const usersByrole = new Map<string, any[]>();

  friendUsers.forEach((user: any) => {
    if (user.userType === "candidate") {
      candidateIds.push(user._id);
      const role = user.role as CandidateRole;
      if (!usersByrole.has(role)) {
        usersByrole.set(role, []);
      }
      usersByrole.get(role)!.push(user);
    } else if (user.userType === "employer") {
      employerIds.push(user._id);
      const role = user.role as EmployerRole;
      if (!usersByrole.has(role)) {
        usersByrole.set(role, []);
      }
      usersByrole.get(role)!.push(user);
    }
  });

  // Batch fetch profiles based on userType and role
  const profilePromises = Array.from(usersByrole.entries()).map(
    async ([role, roleUsers]) => {
      const userType = roleUsers[0].userType;
      const profileIds = roleUsers.map((u: any) => u.profileId).filter(Boolean);

      if (profileIds.length === 0) return [];

      let model: any;
      if (userType === "candidate") {
        model = getCandidateModel(role as CandidateRole);
      } else {
        model = getEmployerModel(role as EmployerRole);
      }

      const profiles = await model.find({ _id: { $in: profileIds } }).lean();
      return profiles;
    }
  );

  const allProfiles = (await Promise.all(profilePromises)).flat();
  const profileMap = new Map(
    allProfiles.map((p: any) => [p._id.toString(), p])
  );

  // Batch fetch additional data for candidates and employers
  const [shortlistData, friendRequestData, jobCounts, followerCounts] =
    await Promise.all([
      // Shortlist data (for candidates)
      candidateIds.length > 0
        ? CandidateShortList.find({
            shortlistedById: new Types.ObjectId(userId),
            candidateId: { $in: candidateIds },
          })
            .select("candidateId")
            .lean()
        : Promise.resolve([]),

      // Friend request data (for candidates)
      candidateIds.length > 0
        ? FriendList.find({
            $or: [
              {
                senderId: new Types.ObjectId(userId),
                receiverId: { $in: candidateIds },
              },
              {
                receiverId: new Types.ObjectId(userId),
                senderId: { $in: candidateIds },
              },
            ],
          })
            .select("senderId receiverId status")
            .lean()
        : Promise.resolve([]),

      // Job counts (for employers)
      employerIds.length > 0
        ? Job.aggregate([
            {
              $match: {
                "creator.creatorId": { $in: employerIds },
                status: "active",
              },
            },
            {
              $group: {
                _id: "$creator.creatorId",
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),

      // Follower counts (for employers)
      employerIds.length > 0
        ? Follow.aggregate([
            {
              $match: {
                followingId: { $in: employerIds },
              },
            },
            {
              $group: {
                _id: "$followingId",
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

  // Create maps for quick lookup
  const shortlistMap = new Map<string, boolean>();
  shortlistData.forEach((item: any) => {
    shortlistMap.set(item.candidateId.toString(), true);
  });

  const friendRequestMap = new Map<
    string,
    { status: string; type: "sent" | "received" }
  >();
  friendRequestData.forEach((fr: any) => {
    const isSender = fr.senderId.toString() === userId;
    const otherUserId = isSender
      ? fr.receiverId.toString()
      : fr.senderId.toString();
    friendRequestMap.set(otherUserId, {
      status: fr.status,
      type: isSender ? "sent" : "received",
    });
  });

  const jobCountMap = new Map(
    jobCounts.map((j: any) => [j._id.toString(), j.count])
  );

  const followerCountMap = new Map(
    followerCounts.map((f: any) => [f._id.toString(), f.count])
  );

  // Get following status for employers
  const followedIdSet = new Set<string>();
  if (employerIds.length > 0) {
    const followedEmployers = await Follow.find({
      followerId: new Types.ObjectId(userId),
      followingId: { $in: employerIds },
    })
      .select("followingId")
      .lean();

    followedEmployers.forEach((f: any) =>
      followedIdSet.add(f.followingId.toString())
    );
  }

  // Transform data to match employer/candidate search response format
  const data = friendRequests
    .map((request: any) => {
      const friendUserId =
        request.senderId.toString() === userId
          ? request.receiverId.toString()
          : request.senderId.toString();

      const user = userMap.get(friendUserId);

      if (!user) return null;

      const profile = user.profileId
        ? profileMap.get(user.profileId.toString())
        : null;
      const userIdStr = user._id.toString();

      // Build response based on userType
      if (user.userType === "candidate") {
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          userType: user.userType,
          profile,
          isShortlisted: shortlistMap.get(userIdStr) || false,
          friendRequestStatus: friendRequestMap.get(userIdStr) || null,
        };
      } else if (user.userType === "employer") {
        return {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          userType: user.userType,
          profile,
          activeJobCount: jobCountMap.get(userIdStr) || 0,
          followerCount: followerCountMap.get(userIdStr) || 0,
          isFollowing: followedIdSet.has(userIdStr),
        };
      }

      return null;
    })
    .filter(Boolean);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Remove a friend (delete accepted friend request)
 */
const removeFriend = async (
  userId: string,
  friendId: string
): Promise<void> => {
  // Find and delete the friendship (can be in either direction)
  const result = await FriendList.findOneAndDelete({
    $or: [
      {
        senderId: new Types.ObjectId(userId),
        receiverId: new Types.ObjectId(friendId),
        status: "accepted",
      },
      {
        senderId: new Types.ObjectId(friendId),
        receiverId: new Types.ObjectId(userId),
        status: "accepted",
      },
    ],
  });

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Friendship not found or already removed"
    );
  }
};

/**
 * Cancel a sent friend request
 */
const cancelFriendRequest = async (
  userId: string,
  requestId: string
): Promise<void> => {
  // Find the friend request
  const friendRequest = await FriendList.findById(requestId);

  if (!friendRequest) {
    throw new AppError(StatusCodes.NOT_FOUND, "Friend request not found");
  }

  // Verify that the user is the sender of the request
  if (friendRequest.senderId.toString() !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to cancel this friend request"
    );
  }

  // Check if request is still pending
  if (friendRequest.status !== "pending") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "You can only cancel pending friend requests"
    );
  }

  // Delete the request
  await FriendList.findByIdAndDelete(requestId);
};

/**
 * Check if two users are friends
 */
const checkFriendship = async (
  userId: string,
  otherUserId: string
): Promise<{
  areFriends: boolean;
  status: "not_friends" | "pending_sent" | "pending_received" | "friends";
  requestId?: string;
}> => {
  const friendRequest = await FriendList.findOne({
    $or: [
      {
        senderId: new Types.ObjectId(userId),
        receiverId: new Types.ObjectId(otherUserId),
      },
      {
        senderId: new Types.ObjectId(otherUserId),
        receiverId: new Types.ObjectId(userId),
      },
    ],
  });

  if (!friendRequest) {
    return {
      areFriends: false,
      status: "not_friends",
    };
  }

  if (friendRequest.status === "accepted") {
    return {
      areFriends: true,
      status: "friends",
      requestId: friendRequest._id.toString(),
    };
  }

  if (friendRequest.status === "pending") {
    const isPendingSent = friendRequest.senderId.toString() === userId;
    return {
      areFriends: false,
      status: isPendingSent ? "pending_sent" : "pending_received",
      requestId: friendRequest._id.toString(),
    };
  }

  return {
    areFriends: false,
    status: "not_friends",
  };
};

/**
 * Get friends count
 */
const getFriendsCount = async (userId: string): Promise<number> => {
  const count = await FriendList.countDocuments({
    $or: [
      { senderId: new Types.ObjectId(userId), status: "accepted" },
      { receiverId: new Types.ObjectId(userId), status: "accepted" },
    ],
  });

  return count;
};

/**
 * Get pending requests count
 */
const getPendingRequestsCount = async (userId: string): Promise<number> => {
  const count = await FriendList.countDocuments({
    receiverId: new Types.ObjectId(userId),
    status: "pending",
  });

  return count;
};

export const FriendListService = {
  sendFriendRequest,
  respondToFriendRequest,
  getReceivedFriendRequests,
  getSentFriendRequests,
  getFriends,
  removeFriend,
  cancelFriendRequest,
  checkFriendship,
  getFriendsCount,
  getPendingRequestsCount,
};
