import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AgentRatingService } from "./agentRating.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Create a new rating for an agent
 * POST /api/v1/agent-rating
 */
const createAgentRating = catchAsync(async (req: Request, res: Response) => {
  const ratedByUserId = req.user?.id;
  const ratedByUserType = req.user?.userType as "candidate" | "employer";
  const ratedByUserRole = req.user?.role;
  const { agentUserId, rating } = req.body;

  const result = await AgentRatingService.createAgentRating(
    agentUserId,
    ratedByUserId!,
    ratedByUserType,
    ratedByUserRole!,
    rating
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Agent rated successfully",
    data: result,
  });
});

/**
 * Get all ratings for a specific agent
 * GET /api/v1/agent-rating/agent/:agentUserId
 */
const getAgentRatings = catchAsync(async (req: Request, res: Response) => {
  const { agentUserId } = req.params;

  const result = await AgentRatingService.getAgentRatings(agentUserId, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent ratings retrieved successfully",
    data: {
      ratings: result.data,
      averageRating: result.averageRating,
      totalRatings: result.totalRatings,
    },
    meta: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPage: result.pagination.totalPages,
    },
  });
});

/**
 * Check if user has rated a specific agent
 * GET /api/v1/agent-rating/check/:agentUserId
 */
const checkUserRatedAgent = catchAsync(async (req: Request, res: Response) => {
  const { agentUserId } = req.params;
  const ratedByUserId = req.user?.id;

  const result = await AgentRatingService.checkUserRatedAgent(
    agentUserId,
    ratedByUserId!
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.hasRated
      ? "User has rated this agent"
      : "User has not rated this agent",
    data: result,
  });
});

/**
 * Get rating by ID
 * GET /api/v1/agent-rating/:ratingId
 */
const getAgentRatingById = catchAsync(async (req: Request, res: Response) => {
  const { ratingId } = req.params;

  const result = await AgentRatingService.getAgentRatingById(ratingId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Rating retrieved successfully",
    data: result,
  });
});

/**
 * Get average rating for an agent
 * GET /api/v1/agent-rating/average/:agentUserId
 */
const getAgentAverageRating = catchAsync(async (req: Request, res: Response) => {
  const { agentUserId } = req.params;

  const result = await AgentRatingService.getAgentAverageRating(agentUserId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent average rating retrieved successfully",
    data: result,
  });
});

/**
 * Get ratings given by the authenticated user
 * GET /api/v1/agent-rating/my-ratings
 */
const getMyRatings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await AgentRatingService.getRatingsByUser(userId!, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Your ratings retrieved successfully",
    data: result.data,
    meta: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPage: result.pagination.totalPages,
    },
  });
});

export const AgentRatingController = {
  createAgentRating,
  getAgentRatings,
  checkUserRatedAgent,
  getAgentRatingById,
  getAgentAverageRating,
  getMyRatings,
};
