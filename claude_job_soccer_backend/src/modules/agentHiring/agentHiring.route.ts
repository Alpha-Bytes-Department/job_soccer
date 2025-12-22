import express, { Router } from "express";
import { AgentHiringController } from "./agentHiring.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  createAgentHiringSchema,
  updateHiringStatusSchema,
  getHiringByIdSchema,
} from "./agentHiring.dto";
import { UserType, EmployerRole } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/agent-hiring
 * @desc    Create a new agent hiring request
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(createAgentHiringSchema),
  AgentHiringController.createAgentHiring
);

/**
 * @route   GET /api/v1/agent-hiring/my-hirings
 * @desc    Get all hirings for the authenticated user (who hired agents)
 * @access  Private (Candidate & Employer)
 * @query   page, limit, status
 */
router.get(
  "/my-hirings",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  AgentHiringController.getMyHirings
);

/**
 * @route   GET /api/v1/agent-hiring/agent-requests
 * @desc    Get all hirings for the authenticated agent (requests received)
 * @access  Private (Employer with Agent role)
 * @query   page, limit, status
 */
router.get(
  "/agent-requests",
  auth(UserType.EMPLOYER),
  AgentHiringController.getAgentRequests
);
//!not now
/**
 * @route   GET /api/v1/agent-hiring/agent-stats
 * @desc    Get hiring statistics for the authenticated agent
 * @access  Private (Employer with Agent role)
 */
router.get(
  "/agent-stats",
  auth(UserType.EMPLOYER),
  AgentHiringController.getAgentStats
);

/**
 * @route   GET /api/v1/agent-hiring/check-active/:agentUserId
 * @desc    Check if user has an active hiring with an agent
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/check-active/:agentUserId",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  AgentHiringController.checkActiveHiring
);

/**
 * @route   GET /api/v1/agent-hiring/:hiringId
 * @desc    Get hiring by ID
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/:hiringId",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(getHiringByIdSchema),
  AgentHiringController.getHiringById
);

/**
 * @route   PATCH /api/v1/agent-hiring/:hiringId/status
 * @desc    Update hiring status
 * @access  Private (Candidate & Employer)
 * @note    Only agent can accept/reject, only hiring user can mark as completed
 */
router.patch(
  "/:hiringId/status",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(updateHiringStatusSchema),
  AgentHiringController.updateHiringStatus
);

export const AgentHiringRoutes: Router = router;
