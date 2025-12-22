import express, { Router } from "express";
import { AgentRatingController } from "./agentRating.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  createAgentRatingSchema,
  getAgentRatingsByAgentIdSchema,
  checkUserRatedAgentSchema,
} from "./agentRating.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/agent-rating
 * @desc    Create a new rating for an agent
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(createAgentRatingSchema),
  AgentRatingController.createAgentRating
);

//! not now
/**
 * @route   GET /api/v1/agent-rating/my-ratings
 * @desc    Get ratings given by the authenticated user
 * @access  Private (Candidate & Employer)
 * @query   page, limit
 */
router.get(
  "/my-ratings",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  AgentRatingController.getMyRatings
);
//! not now
/**
 * @route   GET /api/v1/agent-rating/agent/:agentUserId
 * @desc    Get all ratings for a specific agent
 * @access  Public
 * @query   page, limit
 */
router.get(
  "/agent/:agentUserId",
  validateRequest(getAgentRatingsByAgentIdSchema),
  AgentRatingController.getAgentRatings
);

/**
 * @route   GET /api/v1/agent-rating/average/:agentUserId
 * @desc    Get average rating for a specific agent
 * @access  Public
 */
router.get(
  "/average/:agentUserId",
  AgentRatingController.getAgentAverageRating
);

/**
 * @route   GET /api/v1/agent-rating/check/:agentUserId
 * @desc    Check if the authenticated user has rated a specific agent
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/check/:agentUserId",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(checkUserRatedAgentSchema),
  AgentRatingController.checkUserRatedAgent
);

//! not now
/**
 * @route   GET /api/v1/agent-rating/:ratingId
 * @desc    Get rating by ID
 * @access  Public
 */
router.get("/:ratingId", AgentRatingController.getAgentRatingById);

export const AgentRatingRoutes: Router = router;
