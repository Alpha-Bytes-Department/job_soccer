import { Router, type IRouter } from "express";
import { ProfileViewController } from "./profileView.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import { ProfileViewValidation } from "./profileView.dto";

const router: IRouter = Router();

/**
 * AUTHENTICATED USER ROUTES
 * Routes for tracking and viewing profile analytics
 */

/**
 * POST /api/v1
 * 
 * 
 * Track a profile view when authenticated user views another user's profile
 * 
 * Auth: Required
 * 
 * Body:
 *   - profileOwnerId: string (required) - MongoDB ObjectId of the profile being viewed
 * 
 * Response:
 * {
 *   viewerId: ObjectId,
 *   viewerType: "candidate" | "employer",
 *   viewerRole: string,
 *   profileOwnerId: ObjectId,
 *   profileOwnerType: "candidate" | "employer",
 *   profileOwnerRole: string,
 *   createdAt: Date
 * }
 * 
 * Note: Cannot track views on your own profile
 */
router.post(
  "/track",
  auth(),
  validateRequest(ProfileViewValidation.trackProfileViewSchema),
  ProfileViewController.trackProfileView
);

/**
 * GET /api/v1/profile-views/my-views
 * 
 * Get who viewed my profile with filtering and pagination
 * 
 * Auth: Required
 * 
 * Query params (all optional):
 *   - days: number (filter views from last N days, e.g., 7, 30, 90)
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 * 
 * Response:
 * {
 *   data: [
 *     {
 *       viewerId: {
 *         firstName: string,
 *         lastName: string,
 *         email: string,
 *         role: string,
 *         userType: string,
 *         profileImage: string
 *       },
 *       viewerType: string,
 *       viewerRole: string,
 *       createdAt: Date
 *     }
 *   ],
 *   meta: {
 *     page: number,
 *     limit: number,
 *     total: number,
 *     totalPages: number,
 *     totalViews: number,
 *     uniqueViewers: number
 *   }
 * }
 * 
 * Example: GET /api/v1/profile-views/my-views?days=7&page=1&limit=20
 */
router.get(
  "/my-views",
  auth(),
  validateRequest(ProfileViewValidation.getProfileViewsQuerySchema),
  ProfileViewController.getMyProfileViews
);

/**
 * GET /api/v1/profile-views/my-stats
 * 
 * Get profile view statistics for authenticated user
 * Includes breakdown by time periods (today, last 7 days, last 30 days)
 * 
 * Auth: Required
 * 
 * Response:
 * {
 *   total: number (all time views),
 *   today: number (views today),
 *   last7Days: number (views in last 7 days),
 *   last30Days: number (views in last 30 days),
 *   uniqueViewers: {
 *     total: number (all time unique viewers),
 *     last7Days: number (unique viewers last 7 days),
 *     last30Days: number (unique viewers last 30 days)
 *   }
 * }
 */
router.get(
  "/my-stats",
  auth(),
  ProfileViewController.getMyProfileViewStats
);

/**
 * GET /api/v1/profile-views/user/:userId
 * 
 * Get profile views for a specific user
 * Can be used by the user themselves or admins
 * 
 * Auth: Required
 * 
 * Params:
 *   - userId: string (required) - MongoDB ObjectId of the user
 * 
 * Query params (all optional):
 *   - days: number (filter views from last N days)
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 * 
 * Response: Same as /my-views
 * 
 * Example: GET /api/v1/profile-views/user/507f1f77bcf86cd799439011?days=30
 */
router.get(
  "/user/:userId",
  auth(),
  validateRequest(ProfileViewValidation.getProfileViewsQuerySchema),
  ProfileViewController.getProfileViewsByUserId
);

/**
 * GET /api/v1/profile-views/user/:userId/stats
 * 
 * Get profile view statistics for a specific user
 * 
 * Auth: Required
 * 
 * Params:
 *   - userId: string (required) - MongoDB ObjectId of the user
 * 
 * Response: Same as /my-stats
 */
router.get(
  "/user/:userId/stats",
  auth(),
  ProfileViewController.getProfileViewStatsByUserId
);

export const ProfileViewRoutes: IRouter = router;
