import { Types } from "mongoose";
import { ProfileView } from "./profileView.model";
import { IProfileView } from "./profileView.interface";
import AppError from "../../errors/AppError";
import { StatusCodes } from "http-status-codes";
import { User } from "../user/user.model";

/**
 * Track a profile view
 * Records when an authenticated user views another user's profile
 */
const trackProfileView = async (
  viewerId: string,
  viewerType: "candidate" | "employer",
  viewerRole: string,
  profileOwnerId: string
): Promise<IProfileView> => {
  // Prevent users from viewing their own profile (optional - remove if you want to track self-views)
  if (viewerId === profileOwnerId) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Cannot track views on your own profile"
    );
  }

  // Check if profile owner exists
  const profileOwner = await User.findById(profileOwnerId);
  if (!profileOwner) {
    throw new AppError(StatusCodes.NOT_FOUND, "Profile owner not found");
  }

  // Create profile view record
  const profileView = await ProfileView.create({
    viewerId: new Types.ObjectId(viewerId),
    viewerType,
    viewerRole,
    profileOwnerId: new Types.ObjectId(profileOwnerId),
    profileOwnerType: profileOwner.userType as "candidate" | "employer",
    profileOwnerRole: profileOwner.role!,
  });

  // Populate viewer details before returning
  const populatedView = await ProfileView.findById(profileView._id)
    .populate({
      path: "viewerId",
      select: "firstName lastName email role userType profileImage",
    })
    .lean();

  return populatedView as IProfileView;
};

/**
 * Get total view count for a profile owner
 */
const getTotalViewCount = async (profileOwnerId: string): Promise<number> => {
  const count = await ProfileView.countDocuments({
    profileOwnerId: new Types.ObjectId(profileOwnerId),
  });

  return count;
};

/**
 * Get profile views with filtering by date range and pagination
 */
const getProfileViews = async (
  profileOwnerId: string,
  query: {
    days?: number;
    page?: number;
    limit?: number;
  }
): Promise<{
  data: IProfileView[];
  totalViews: number;
  uniqueViewers: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  // Build date filter
  const matchQuery: any = {
    profileOwnerId: new Types.ObjectId(profileOwnerId),
  };

  if (query.days) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - query.days);
    matchQuery.createdAt = { $gte: daysAgo };
  }

  // Get paginated views
  const views = await ProfileView.find(matchQuery)
    .populate({
      path: "viewerId",
      select: "firstName lastName email role userType profileImage",
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Get total count for pagination
  const total = await ProfileView.countDocuments(matchQuery);

  // Get total views (all time if no date filter, or within date range)
  const totalViews = total;

  // Get unique viewers count
  const uniqueViewers = await ProfileView.distinct("viewerId", matchQuery);

  return {
    data: views as IProfileView[],
    totalViews,
    uniqueViewers: uniqueViewers.length,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

/**
 * Get profile view statistics with breakdown by time periods
 */
const getProfileViewStats = async (
  profileOwnerId: string
): Promise<{
  total: number;
  today: number;
  last7Days: number;
  last30Days: number;
  uniqueViewers: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
}> => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const profileOwnerObjectId = new Types.ObjectId(profileOwnerId);

  // Get total views
  const total = await ProfileView.countDocuments({
    profileOwnerId: profileOwnerObjectId,
  });

  // Get today's views
  const todayCount = await ProfileView.countDocuments({
    profileOwnerId: profileOwnerObjectId,
    createdAt: { $gte: today },
  });

  // Get last 7 days views
  const last7DaysCount = await ProfileView.countDocuments({
    profileOwnerId: profileOwnerObjectId,
    createdAt: { $gte: last7Days },
  });

  // Get last 30 days views
  const last30DaysCount = await ProfileView.countDocuments({
    profileOwnerId: profileOwnerObjectId,
    createdAt: { $gte: last30Days },
  });

  // Get unique viewers (total)
  const uniqueViewersTotal = await ProfileView.distinct("viewerId", {
    profileOwnerId: profileOwnerObjectId,
  });

  // Get unique viewers (last 7 days)
  const uniqueViewers7Days = await ProfileView.distinct("viewerId", {
    profileOwnerId: profileOwnerObjectId,
    createdAt: { $gte: last7Days },
  });

  // Get unique viewers (last 30 days)
  const uniqueViewers30Days = await ProfileView.distinct("viewerId", {
    profileOwnerId: profileOwnerObjectId,
    createdAt: { $gte: last30Days },
  });

  return {
    total,
    today: todayCount,
    last7Days: last7DaysCount,
    last30Days: last30DaysCount,
    uniqueViewers: {
      total: uniqueViewersTotal.length,
      last7Days: uniqueViewers7Days.length,
      last30Days: uniqueViewers30Days.length,
    },
  };
};

/**
 * Get who viewed my profile (for authenticated user)
 */
const getWhoViewedMyProfile = async (
  profileOwnerId: string,
  query: {
    days?: number;
    page?: number;
    limit?: number;
  }
): Promise<{
  data: IProfileView[];
  stats: {
    totalViews: number;
    uniqueViewers: number;
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
}> => {
  const result = await getProfileViews(profileOwnerId, query);
  return {
    data: result.data,
    stats: {
      totalViews: result.totalViews,
      uniqueViewers: result.uniqueViewers,
    },
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
  };
};

export const ProfileViewService = {
  trackProfileView,
  getTotalViewCount,
  getProfileViews,
  getProfileViewStats,
  getWhoViewedMyProfile,
};
