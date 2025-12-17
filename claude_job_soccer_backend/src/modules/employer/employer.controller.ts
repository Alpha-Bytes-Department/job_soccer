import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { EmployerServices } from "./employer.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Search employers by name, category, and country
 * Semi-private: Authenticated users get filtered results
 * Query params: searchTerm, role, country, page, limit, sortBy
 */
const searchEmployers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await EmployerServices.searchEmployers(req.query, userId);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employers retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

/**
 * Get featured employers grouped by category
 * Semi-private: Authenticated users get isFollowing field
 * Returns max 4 employers per category
 */
const getFeaturedEmployers = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await EmployerServices.getFeaturedEmployers(userId);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Featured employers retrieved successfully",
    data: result,
  });
});

/**
 * Get employer by ID with full profile details
 * Semi-private: Authenticated users get isFollowing field
 */
const getEmployerById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await EmployerServices.getEmployerById(req.params.id, userId);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employer retrieved successfully",
    data: result,
  });
});

export const EmployerController = {
  searchEmployers,
  getFeaturedEmployers,
  getEmployerById,
};
