import express, { Router } from "express";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.dto";
import fileUploadHandler from "../../shared/middlewares/fileUploadHandler";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";

const router = express.Router();

/**
 * GET /api/v1/user
 * Get all users with pagination and filtering
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 *   - role: string (filter by user role)
 * Response: Paginated array of user objects
 */
router.get("/", UserController.getAllUsers);

/**
 * GET /api/v1/user/me
 * Get the authenticated user's profile
 * Auth: Required
 * Response: User object with full profile details
 */
router.get("/me", auth(), UserController.getMe);

/**
 * GET /api/v1/user/:id
 * Get a specific user by ID
 * Params:
 *   - id: string (required) - The ID of the user
 * Response: User object with profile details
 */
router.get("/:id", UserController.getUserById);

/**
 * POST /api/v1/user/profile
 * Create user profile with media files
 * Supports file uploads for profile images and videos
 * Auth: Required
 * Body: Multipart form data with user profile fields and media files
 * Response: Created user profile object
 */
router.post(
  "/profile",
  auth(),
  fileUploadHandler,
  UserController.addUserProfile
);

/**
 * PATCH /api/v1/user/profile
 * Update user profile with media files
 * Supports file uploads for profile images and videos
 * Auth: Required
 * Body: Multipart form data with user profile fields and media files
 * Response: Updated user profile object
 */
router.patch(
  "/profile",
  auth(),
  fileUploadHandler,
  UserController.updateUserProfile
);

/**
 * PATCH /api/v1/user/profile/video/:videoIndex
 * Update a specific video by its index
 * Auth: Required
 * Params:
 *   - videoIndex: number (required) - The index of the video to update (0-based)
 * Body: Multipart form data with video file and metadata
 *   For Players: { videoTitle: string }
 *   For Staff: { videoTitle: string, videoCategory: string, position: string }
 * Response: Updated profile with modified video
 */
router.patch(
  "/profile/video/:videoIndex",
  auth(),
  fileUploadHandler,
  UserController.updateProfileVideo
);

/**
 * POST /api/v1/user/profile/video
 * Add a new video to user profile
 * Auth: Required
 * Body: Multipart form data with video file and metadata
 *   For Players: { videoTitle: string }
 *   For Staff: { videoTitle: string, videoCategory: string, position: string }
 * Response: Updated profile with new video added
 */
router.post(
  "/profile/video",
  auth(),
  fileUploadHandler,
  UserController.addProfileVideo
);

/**
 * DELETE /api/v1/user/profile/video/:videoIndex
 * Delete a specific video by its index
 * Auth: Required
 * Params:
 *   - videoIndex: number (required) - The index of the video to delete (0-based)
 * Response: Updated profile with video removed
 */
router.delete(
  "/profile/video/:videoIndex",
  auth(),
  UserController.deleteProfileVideo
);

/**
 * PATCH /api/v1/user/:id
 * Update user information
 * Supports file uploads for profile images and videos
 * Params:
 *   - id: string (required) - The ID of the user to update
 * Body: Multipart form data with fields to update
 * Response: Updated user object
 */
router.patch(
  "/:id", 
  fileUploadHandler,
  validateRequest(UserValidation.updateUser),
  UserController.updateUser
);

/**
 * PATCH /api/v1/user/:id/status
 * Update user activation status (active/inactive)
 * Params:
 *   - id: string (required) - The ID of the user
 * Body:
 *   - status: string (required) - New activation status
 * Response: Updated user object
 */
router.patch(
  "/:id/status",
  validateRequest(UserValidation.updateUserActivationStatus),
  UserController.updateUserActivationStatus
);

/**
 * PATCH /api/v1/user/:id/role
 * Update user role (candidate/employer)
 * Params:
 *   - id: string (required) - The ID of the user
 * Body:
 *   - role: string (required) - New user role
 * Response: Updated user object
 */
router.patch(
  "/:id/role",
  validateRequest(UserValidation.updateUserRole),
  UserController.updateUserRole
);

export const UserRoutes: Router = router;
