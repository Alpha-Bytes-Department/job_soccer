import { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

// Get total users, paid, and unpaid count
const getUserCounts = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getUserCounts();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User counts retrieved successfully",
    data: result,
  });
});

// Get monthly income for current year
const getMonthlyIncome = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getMonthlyIncome();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Monthly income retrieved successfully",
    data: result,
  });
});

// Get user list with filters and pagination
const getUserList = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, search, userType, subscriptionType, role,email } = req.query;

  const result = await DashboardService.getUserList({
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
    search: search as string,
    userType: userType as "candidate" | "employer",
    subscriptionType: subscriptionType as "paid" | "free",
    role: role as string,
    email: email as string,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User list retrieved successfully",
    data: result,
  });
});

// Get user details by ID
const getUserDetails = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await DashboardService.getUserDetails(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User details retrieved successfully",
    data: result,
  });
});

// Get user statistics with growth
const getUserStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getUserStatistics();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User statistics retrieved successfully",
    data: result,
  });
});

// Get payment statistics
const getPaymentStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getPaymentStatistics();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Payment statistics retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  getUserCounts,
  getMonthlyIncome,
  getUserList,
  getUserDetails,
  getUserStatistics,
  getPaymentStatistics,
};
