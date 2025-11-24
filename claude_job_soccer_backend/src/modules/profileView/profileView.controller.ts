import { Request, Response } from "express";
import { ProfileViewService } from "./profileView.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { StatusCodes } from "http-status-codes";

/**
 * Track a profile view
 */
const trackProfileView = catchAsync(async (req: Request, res: Response) => {
  const { profileOwnerId } = req.body;
  const viewer = req.user;

  const result = await ProfileViewService.trackProfileView(
    viewer!._id,
    viewer!.userType as "candidate" | "employer",
    viewer!.role!,
    profileOwnerId
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Profile view tracked successfully",
    data: result,
  });
});

/**
 * Get profile views for authenticated user (who viewed my profile)
 */
const getMyProfileViews = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;
  const { days, page, limit } = req.query;

  const result = await ProfileViewService.getWhoViewedMyProfile(userId, {
    days: days ? parseInt(days as string) : undefined,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile views retrieved successfully",
    data: {
      views: result.data,
      stats: result.stats,
    },
    meta: result.meta,
  });
});

/**
 * Get profile view statistics for authenticated user
 */
const getMyProfileViewStats = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;

    const result = await ProfileViewService.getProfileViewStats(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile view statistics retrieved successfully",
      data: result,
    });
  }
);

/**
 * Get profile views for a specific user (admin or public)
 */
const getProfileViewsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { days, page, limit } = req.query;

    const result = await ProfileViewService.getProfileViews(userId, {
      days: days ? parseInt(days as string) : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile views retrieved successfully",
      data: {
        views: result.data,
        totalViews: result.totalViews,
        uniqueViewers: result.uniqueViewers,
      },
      meta: result.meta,
    });
  }
);

/**
 * Get profile view statistics for a specific user
 */
const getProfileViewStatsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await ProfileViewService.getProfileViewStats(userId);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Profile view statistics retrieved successfully",
      data: result,
    });
  }
);

export const ProfileViewController = {
  trackProfileView,
  getMyProfileViews,
  getMyProfileViewStats,
  getProfileViewsByUserId,
  getProfileViewStatsByUserId,
};
