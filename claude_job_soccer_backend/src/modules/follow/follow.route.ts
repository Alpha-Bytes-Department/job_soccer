import express, { Router } from "express";
import { FollowController } from "./follow.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import { followEmployerSchema, unfollowEmployerSchema } from "./follow.dto";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/follow
 * @desc    Follow an employer
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(),
  validateRequest(followEmployerSchema),
  FollowController.followEmployer
);

/**
 * @route   GET /api/v1/follow/following
 * @desc    Get all employers that the authenticated user is following
 * @access  Private (Candidate & Employer)
 * @query   page, limit, followingRole
 */
router.get(
  "/following",
  auth(),
  FollowController.getFollowing
);

/**
 * @route   GET /api/v1/follow/following/count
 * @desc    Get count of employers that the authenticated user is following
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/following/count",
  auth(),
  FollowController.getFollowingCount
);

/**
 * @route   GET /api/v1/follow/check/:employerId
 * @desc    Check if the authenticated user is following a specific employer
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/check/:employerId",
  auth(),
  FollowController.checkIfFollowing
);

/**
 * @route   GET /api/v1/follow/followers/:employerId
 * @desc    Get all followers of a specific employer
 * @access  Public
 * @query   page, limit, followerType, followerRole
 */
router.get(
  "/followers/:employerId",
  FollowController.getFollowers
);

/**
 * @route   GET /api/v1/follow/followers/:employerId/count
 * @desc    Get count of followers for a specific employer
 * @access  Public
 */
router.get(
  "/followers/:employerId/count",
  FollowController.getFollowersCount
);

/**
 * @route   DELETE /api/v1/follow/:employerId
 * @desc    Unfollow an employer
 * @access  Private (Candidate & Employer)
 */
router.delete(
  "/:employerId",
  auth(),
  validateRequest(unfollowEmployerSchema),
  FollowController.unfollowEmployer
);

export default router;
