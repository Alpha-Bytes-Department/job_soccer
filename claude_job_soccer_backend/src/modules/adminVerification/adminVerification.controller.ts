import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { AdminVerificationService } from "./adminVerification.service";
import AppError from "../../errors/AppError";

/**
 * Request verification (for candidates and employers)
 * POST /api/v1/admin-verification/request
 */
const requestVerification = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User authentication required");
  }

  const result = await AdminVerificationService.requestVerification(userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Verification request submitted successfully",
    data: result,
  });
});

/**
 * Get all verification requests with filters (Admin only)
 * GET /api/v1/admin-verification/requests
 * Query params: status, userType, page, limit, sortBy, sortOrder
 */
const getVerificationRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminVerificationService.getVerificationRequests(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Verification requests retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

/**
 * Get verification request details by ID (Admin only)
 * GET /api/v1/admin-verification/:id
 */
const getVerificationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminVerificationService.getVerificationById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Verification request details retrieved successfully",
    data: result,
  });
});

/**
 * Update verification status - approve or reject (Admin only)
 * PATCH /api/v1/admin-verification/:id/status
 */
const updateVerificationStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const adminId = (req as any).user?.id;

  if (!adminId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Admin authentication required");
  }

  const result = await AdminVerificationService.updateVerificationStatus(
    id,
    adminId,
    status
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Verification request ${status} successfully`,
    data: result,
  });
});

/**
 * Get current user's verification status
 * GET /api/v1/admin-verification/my-status
 */
const getMyVerificationStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User authentication required");
  }

  const result = await AdminVerificationService.getUserVerificationStatus(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Verification status retrieved successfully",
    data: result,
  });
});

export const AdminVerificationController = {
  requestVerification,
  getVerificationRequests,
  getVerificationById,
  updateVerificationStatus,
  getMyVerificationStatus,
};
