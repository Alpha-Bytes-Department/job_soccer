import { Types } from "mongoose";
import { Follow } from "./follow.model";
import { TFollow } from "./follow.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";

/**
 * Follow an employer
 * Both candidates and employers can follow employers
 */
const followEmployer = async (
  followerId: string,
  followerType: "candidate" | "employer",
  followerRole: string,
  employerId: string
): Promise<TFollow> => {
  // Prevent users from following themselves
  if (followerId === employerId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot follow yourself");
  }

  // Check if employer exists and is actually an employer
  const employer = await User.findById(employerId);
  if (!employer) {
    throw new AppError(StatusCodes.NOT_FOUND, "Employer not found");
  }

  // Check if already following
  const existingFollow = await Follow.findOne({
    followerId: new Types.ObjectId(followerId),
    followingId: new Types.ObjectId(employerId),
  });

  if (existingFollow) {
    throw new AppError(StatusCodes.CONFLICT, "Already following this employer");
  }

  // Create follow relationship
  const follow = await Follow.create({
    followerId: new Types.ObjectId(followerId),
    followerType,
    followerRole,
    followingId: new Types.ObjectId(employerId),
    followingRole: employer.role,
  });

  // Populate employer details before returning
  const populatedFollow = await Follow.findById(follow._id)
    .populate({
      path: "followingId",
      select: "email role userType createdAt",
    })
    .lean();

  return populatedFollow as TFollow;
};

/**
 * Unfollow an employer
 */
const unfollowEmployer = async (
  followerId: string,
  employerId: string
): Promise<void> => {
  const result = await Follow.findOneAndDelete({
    followerId: new Types.ObjectId(followerId),
    followingId: new Types.ObjectId(employerId),
  });

  if (!result) {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "Follow relationship not found or already removed"
    );
  }
};

/**
 * Get all employers that a user is following with pagination
 */
const getFollowing = async (
  userId: string,
  query: Record<string, any>
): Promise<{
  data: TFollow[];
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
    followerId: new Types.ObjectId(userId),
  };

  // Optional filters
  if (query.followingRole) {
    filter.followingRole = query.followingRole;
  }

  // Get total count
  const total = await Follow.countDocuments(filter);

  // Get paginated data
  const data = await Follow.find(filter)
    .populate({
      path: "followingId",
      select: "email role userType createdAt",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as TFollow[],
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Get all followers of an employer with pagination
 */
const getFollowers = async (
  employerId: string,
  query: Record<string, any>
): Promise<{
  data: TFollow[];
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
    followingId: new Types.ObjectId(employerId),
  };

  // Optional filters
  if (query.followerType) {
    filter.followerType = query.followerType;
  }

  if (query.followerRole) {
    filter.followerRole = query.followerRole;
  }

  // Get total count
  const total = await Follow.countDocuments(filter);

  // Get paginated data
  const data = await Follow.find(filter)
    .populate({
      path: "followerId",
      select: "email role userType createdAt",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const totalPages = Math.ceil(total / limit);

  return {
    data: data as TFollow[],
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Check if a user is following an employer
 */
const isFollowing = async (
  followerId: string,
  employerId: string
): Promise<boolean> => {
  const follow = await Follow.findOne({
    followerId: new Types.ObjectId(followerId),
    followingId: new Types.ObjectId(employerId),
  });

  return !!follow;
};

/**
 * Get count of users that the authenticated user is following
 */
const getFollowingCount = async (userId: string): Promise<number> => {
  const count = await Follow.countDocuments({
    followerId: new Types.ObjectId(userId),
  });

  return count;
};

/**
 * Get count of followers for a specific employer
 */
const getFollowersCount = async (employerId: string): Promise<number> => {
  const count = await Follow.countDocuments({
    followingId: new Types.ObjectId(employerId),
  });

  return count;
};

export const FollowService = {
  followEmployer,
  unfollowEmployer,
  getFollowing,
  getFollowers,
  isFollowing,
  getFollowingCount,
  getFollowersCount,
};
