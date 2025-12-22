import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AgentHiringService } from "./agentHiring.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Create a new agent hiring request
 * POST /api/v1/agent-hiring
 */
const createAgentHiring = catchAsync(async (req: Request, res: Response) => {
  const hiredByUserId = req.user?.id;
  const hiredByUserType = req.user?.userType as "candidate" | "employer";
  const hiredByUserRole = req.user?.role;
  const { agentUserId } = req.body;

  const result = await AgentHiringService.createAgentHiring(
    agentUserId,
    hiredByUserId!,
    hiredByUserType,
    hiredByUserRole!
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Agent hiring request created successfully",
    data: result,
  });
});

/**
 * Get all hirings for the authenticated user (who hired agents)
 * GET /api/v1/agent-hiring/my-hirings
 */
const getMyHirings = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await AgentHiringService.getUserHirings(userId!, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Your hirings retrieved successfully",
    data: result.data,
    meta: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPage: result.pagination.totalPages,
    },
  });
});

/**
 * Get all hirings for the authenticated agent (requests received)
 * GET /api/v1/agent-hiring/agent-requests
 */
const getAgentRequests = catchAsync(async (req: Request, res: Response) => {
  const agentUserId = req.user?.id;

  const result = await AgentHiringService.getAgentHirings(
    agentUserId!,
    req.query
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent hiring requests retrieved successfully",
    data: result.data,
    meta: {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPage: result.pagination.totalPages,
    },
  });
});

/**
 * Get hiring by ID
 * GET /api/v1/agent-hiring/:hiringId
 */
const getHiringById = catchAsync(async (req: Request, res: Response) => {
  const { hiringId } = req.params;
  const userId = req.user?.id;

  const result = await AgentHiringService.getHiringById(hiringId, userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Hiring retrieved successfully",
    data: result,
  });
});

/**
 * Update hiring status
 * PATCH /api/v1/agent-hiring/:hiringId/status
 */
const updateHiringStatus = catchAsync(async (req: Request, res: Response) => {
  const { hiringId } = req.params;
  const userId = req.user?.id;
  const userType = req.user?.userType;
  const { status } = req.body;

  const result = await AgentHiringService.updateHiringStatus(
    hiringId,
    userId!,
    userType!,
    status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Hiring ${status} successfully`,
    data: result,
  });
});
//!not now
/**
 * Get hiring statistics for the authenticated agent
 * GET /api/v1/agent-hiring/agent-stats
 */
const getAgentStats = catchAsync(async (req: Request, res: Response) => {
  const agentUserId = req.user?.id;

  const result = await AgentHiringService.getAgentHiringStats(agentUserId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Agent hiring statistics retrieved successfully",
    data: result,
  });
});


/**
 * Check if user has an active hiring with an agent
 * GET /api/v1/agent-hiring/check-active/:agentUserId
 */
const checkActiveHiring = catchAsync(async (req: Request, res: Response) => {
  const { agentUserId } = req.params;
  const hiredByUserId = req.user?.id;

  const result = await AgentHiringService.checkActiveHiring(
    agentUserId,
    hiredByUserId!
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.hasActiveHiring
      ? "User has an active hiring with this agent"
      : "User does not have an active hiring with this agent",
    data: result,
  });
});

export const AgentHiringController = {
  createAgentHiring,
  getMyHirings,
  getAgentRequests,
  getHiringById,
  updateHiringStatus,
  getAgentStats,
  checkActiveHiring,
};
