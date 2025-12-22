import { Types } from "mongoose";
import { AgentRating } from "./agentRating.model";
import { IAgentRating } from "./agentRating.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { EmployerRole } from "../user/user.interface";
import { AgentEmp } from "../employer/agentEmp/agentEmp.model";

/**
 * Update agent's average rating and total ratings
 */
const updateAgentRating = async (agentProfileId: string): Promise<void> => {
  const stats = await AgentRating.aggregate([
    { 
      $lookup: {
        from: "users",
        localField: "agentUserId",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    { $match: { "user.profileId": agentProfileId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const averageRating = stats.length > 0 ? Math.round(stats[0].averageRating * 100) / 100 : 0;
  const totalRatings = stats.length > 0 ? stats[0].totalRatings : 0;

  await AgentEmp.findByIdAndUpdate(agentProfileId, {
    averageRating,
    totalRatings,
  });
};

/**
 * Create a new rating for an agent
 * One user can only rate an agent once (enforced by unique index)
 */
const createAgentRating = async (
  agentUserId: string,
  ratedByUserId: string,
  ratedByUserType: "candidate" | "employer",
  ratedByUserRole: string,
  rating: number
): Promise<IAgentRating> => {
  // Prevent users from rating themselves
  if (agentUserId === ratedByUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot rate yourself");
  }

  // Verify the agent user exists and is an agent
  const agentUser = await User.findById(agentUserId);
  if (!agentUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent user not found");
  }

  if (agentUser.userType !== "employer" || agentUser.role !== EmployerRole.AGENT) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an agent");
  }

  if (!agentUser.profileId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Agent profile not found");
  }

  // Check if user has already rated this agent
  const existingRating = await AgentRating.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    ratedByUserId: new Types.ObjectId(ratedByUserId),
  });

  if (existingRating) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You have already rated this agent. Rating updates are not allowed."
    );
  }

  // Create the rating
  const agentRating = await AgentRating.create({
    agentUserId: new Types.ObjectId(agentUserId),
    ratedByUserId: new Types.ObjectId(ratedByUserId),
    ratedByUserType,
    ratedByUserRole,
    rating,
  });

  // Update agent's average rating
  await updateAgentRating(agentUser.profileId);

  // Populate user details before returning
  const populatedRating = await AgentRating.findById(agentRating._id)
    .populate({
      path: "ratedByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  return populatedRating as IAgentRating;
};

/**
 * Get all ratings for a specific agent
 * Includes average rating and total count
 */
const getAgentRatings = async (
  agentUserId: string,
  query: any
): Promise<{
  data: IAgentRating[];
  averageRating: number;
  totalRatings: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Verify the agent user exists
  const agentUser = await User.findById(agentUserId);
  if (!agentUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent user not found");
  }

  if (agentUser.userType !== "employer" || agentUser.role !== EmployerRole.AGENT) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an agent");
  }

  const agentObjectId = new Types.ObjectId(agentUserId);

  // Get ratings with pagination
  const ratings = await AgentRating.find({ agentUserId: agentObjectId })
    .populate({
      path: "ratedByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const total = await AgentRating.countDocuments({ agentUserId: agentObjectId });

  // Calculate average rating
  const ratingStats = await AgentRating.aggregate([
    { $match: { agentUserId: agentObjectId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  const averageRating = ratingStats.length > 0 ? ratingStats[0].averageRating : 0;
  const totalRatings = ratingStats.length > 0 ? ratingStats[0].totalRatings : 0;

  return {
    data: ratings as IAgentRating[],
    averageRating: Math.round(averageRating * 100) / 100, // Round to 2 decimal places
    totalRatings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Check if a user has rated a specific agent
 * Returns boolean
 */
const checkUserRatedAgent = async (
  agentUserId: string,
  ratedByUserId: string
): Promise<{ hasRated: boolean; rating?: IAgentRating }> => {
  const rating = await AgentRating.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    ratedByUserId: new Types.ObjectId(ratedByUserId),
  })
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  return {
    hasRated: !!rating,
    rating: rating ? (rating as IAgentRating) : undefined,
  };
};

/**
 * Get rating by ID
 */
const getAgentRatingById = async (ratingId: string): Promise<IAgentRating> => {
  const rating = await AgentRating.findById(ratingId)
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .populate({
      path: "ratedByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  if (!rating) {
    throw new AppError(StatusCodes.NOT_FOUND, "Rating not found");
  }

  return rating as IAgentRating;
};

/**
 * Get average rating for an agent
 */
const getAgentAverageRating = async (
  agentUserId: string
): Promise<{ averageRating: number; totalRatings: number }> => {
  // Verify the agent user exists
  const agentUser = await User.findById(agentUserId);
  if (!agentUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent user not found");
  }

  if (agentUser.userType !== "employer" || agentUser.role !== EmployerRole.AGENT) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an agent");
  }

  if (!agentUser.profileId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Agent profile not found");
  }

  // Get agent profile
  const agentProfile = await AgentEmp.findById(agentUser.profileId).lean();
  if (!agentProfile) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent profile not found");
  }

  return {
    averageRating: agentProfile.averageRating || 0,
    totalRatings: agentProfile.totalRatings || 0,
  };
};

/**
 * Get ratings given by a user
 */
const getRatingsByUser = async (
  userId: string,
  query: any
): Promise<{
  data: IAgentRating[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const page = parseInt(query.page as string) || 1;
  const limit = parseInt(query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const ratings = await AgentRating.find({
    ratedByUserId: new Types.ObjectId(userId),
  })
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await AgentRating.countDocuments({
    ratedByUserId: new Types.ObjectId(userId),
  });

  return {
    data: ratings as IAgentRating[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const AgentRatingService = {
  createAgentRating,
  getAgentRatings,
  checkUserRatedAgent,
  getAgentRatingById,
  getAgentAverageRating,
  getRatingsByUser,
};
