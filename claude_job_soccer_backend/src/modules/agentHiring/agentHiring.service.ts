import { Types } from "mongoose";
import { AgentHiring } from "./agentHiring.model";
import { IAgentHiring, TAgentHiringStatus } from "./agentHiring.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";
import { EmployerRole } from "../user/user.interface";

/**
 * Create a new agent hiring request
 * Business Logic:
 * - A user can only have one active hiring (pending/accepted) with an agent at a time
 * - If the request is rejected or completed, the user can send another request
 */
const createAgentHiring = async (
  agentUserId: string,
  hiredByUserId: string,
  hiredByUserType: "candidate" | "employer",
  hiredByUserRole: string
): Promise<IAgentHiring> => {
  // Prevent users from hiring themselves
  if (agentUserId === hiredByUserId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "You cannot hire yourself");
  }

  // Verify the agent user exists and is an agent
  const agentUser = await User.findById(agentUserId);
  if (!agentUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent user not found");
  }

  if (
    agentUser.userType !== "employer" ||
    agentUser.role !== EmployerRole.AGENT
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an agent");
  }

  // Check if there's an active hiring (pending or accepted) with this agent
  const activeHiring = await AgentHiring.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    hiredByUserId: new Types.ObjectId(hiredByUserId),
    status: { $in: ["pending", "accepted"] },
  });

  if (activeHiring) {
    throw new AppError(
      StatusCodes.CONFLICT,
      `You already have an active hiring with this agent (status: ${activeHiring.status}). Please wait for the current request to be completed or rejected.`
    );
  }

  // Create the hiring request
  const agentHiring = await AgentHiring.create({
    agentUserId: new Types.ObjectId(agentUserId),
    hiredByUserId: new Types.ObjectId(hiredByUserId),
    hiredByUserType,
    hiredByUserRole,
    status: "pending",
    hiredAt: new Date(),
  });

  // Populate user details before returning
  const populatedHiring = await AgentHiring.findById(agentHiring._id)
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .populate({
      path: "hiredByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  return populatedHiring as IAgentHiring;
};

/**
 * Get all hirings for a user (who hired agents)
 * Supports status filtering
 */
const getUserHirings = async (
  userId: string,
  query: any
): Promise<{
  data: IAgentHiring[];
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
  const status = query.status as TAgentHiringStatus | undefined;

  // Build query
  const queryFilter: any = {
    hiredByUserId: new Types.ObjectId(userId),
  };

  if (status) {
    queryFilter.status = status;
  }

  // Get hirings with pagination
  const hirings = await AgentHiring.find(queryFilter)
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const total = await AgentHiring.countDocuments(queryFilter);

  return {
    data: hirings as IAgentHiring[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all hirings for an agent (requests received)
 * Supports status filtering
 */
const getAgentHirings = async (
  agentUserId: string,
  query: any
): Promise<{
  data: IAgentHiring[];
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
  const status = query.status as TAgentHiringStatus | undefined;

  // Verify the user is an agent
  const agentUser = await User.findById(agentUserId);
  if (!agentUser) {
    throw new AppError(StatusCodes.NOT_FOUND, "Agent user not found");
  }

  if (
    agentUser.userType !== "employer" ||
    agentUser.role !== EmployerRole.AGENT
  ) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is not an agent");
  }

  // Build query
  const queryFilter: any = {
    agentUserId: new Types.ObjectId(agentUserId),
  };

  if (status) {
    queryFilter.status = status;
  }

  // Get hirings with pagination
  const hirings = await AgentHiring.find(queryFilter)
    .populate({
      path: "hiredByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count
  const total = await AgentHiring.countDocuments(queryFilter);

  return {
    data: hirings as IAgentHiring[],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get hiring by ID
 */
const getHiringById = async (
  hiringId: string,
  userId: string
): Promise<IAgentHiring> => {
  const hiring = await AgentHiring.findById(hiringId)
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .populate({
      path: "hiredByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  if (!hiring) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hiring not found");
  }

  // Verify the user is part of this hiring (either agent or the one who hired)
  const userObjectId = new Types.ObjectId(userId);
  if (
    !hiring.agentUserId._id.equals(userObjectId) &&
    !hiring.hiredByUserId._id.equals(userObjectId)
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to view this hiring"
    );
  }

  return hiring as IAgentHiring;
};

/**
 * Update hiring status
 * Only the agent can update to accepted/rejected
 * Only the user who hired can update to completed
 */
const updateHiringStatus = async (
  hiringId: string,
  userId: string,
  userType: string,
  status: TAgentHiringStatus
): Promise<IAgentHiring> => {
  const hiring = await AgentHiring.findById(hiringId);

  if (!hiring) {
    throw new AppError(StatusCodes.NOT_FOUND, "Hiring not found");
  }

  const userObjectId = new Types.ObjectId(userId);

  // Status transition validation
  if (status === "accepted" || status === "rejected") {
    // Only agent can accept or reject
    if (!hiring.agentUserId.equals(userObjectId)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Only the agent can accept or reject hiring requests"
      );
    }

    // Can only accept/reject if status is pending
    if (hiring.status !== "pending") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Cannot ${status} a hiring that is not pending (current status: ${hiring.status})`
      );
    }

    hiring.status = status;
    hiring.respondedAt = new Date();
  } else if (status === "completed") {
    // Only the user who hired can mark as completed
    if (!hiring.hiredByUserId.equals(userObjectId)) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "Only the user who hired the agent can mark the hiring as completed"
      );
    }

    // Can only complete if status is accepted
    if (hiring.status !== "accepted") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Cannot complete a hiring that is not accepted (current status: ${hiring.status})`
      );
    }

    hiring.status = status;
    hiring.completedAt = new Date();
  } else {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid status");
  }

  await hiring.save();

  // Populate and return
  const populatedHiring = await AgentHiring.findById(hiring._id)
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .populate({
      path: "hiredByUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  return populatedHiring as IAgentHiring;
};

/**
 * Get hiring statistics for an agent
 */
const getAgentHiringStats = async (
  agentUserId: string
): Promise<{
  totalHirings: number;
  pendingCount: number;
  acceptedCount: number;
  rejectedCount: number;
  completedCount: number;
}> => {
  const agentObjectId = new Types.ObjectId(agentUserId);

  const stats = await AgentHiring.aggregate([
    { $match: { agentUserId: agentObjectId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    totalHirings: 0,
    pendingCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    completedCount: 0,
  };

  stats.forEach((stat) => {
    result.totalHirings += stat.count;
    if (stat._id === "pending") result.pendingCount = stat.count;
    if (stat._id === "accepted") result.acceptedCount = stat.count;
    if (stat._id === "rejected") result.rejectedCount = stat.count;
    if (stat._id === "completed") result.completedCount = stat.count;
  });

  return result;
};

/**
 * Check if a user has an active hiring with an agent
 */
const checkActiveHiring = async (
  agentUserId: string,
  hiredByUserId: string
): Promise<{ hasActiveHiring: boolean; hiring?: IAgentHiring }> => {
  const activeHiring = await AgentHiring.findOne({
    agentUserId: new Types.ObjectId(agentUserId),
    hiredByUserId: new Types.ObjectId(hiredByUserId),
    status: { $in: ["pending", "accepted"] },
  })
    .populate({
      path: "agentUserId",
      select: "firstName lastName email profileImage role userType",
    })
    .lean();

  return {
    hasActiveHiring: !!activeHiring,
    hiring: activeHiring ? (activeHiring as IAgentHiring) : undefined,
  };
};

export const AgentHiringService = {
  createAgentHiring,
  getUserHirings,
  getAgentHirings,
  getHiringById,
  updateHiringStatus,
  getAgentHiringStats,
  checkActiveHiring,
};
