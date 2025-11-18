import express, { Router } from "express";
import { AdminVerificationController } from "./adminVerification.controller";
import validateRequest from "../../shared/middlewares/validateRequest";
import auth from "../../shared/middlewares/auth";
import { UserType } from "../user/user.interface";
import {
  requestVerificationSchema,
  getVerificationRequestsSchema,
  getVerificationByIdSchema,
  updateVerificationStatusSchema,
} from "./adminVerification.dto";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/admin-verification/request
 * @desc    Request verification (for candidates and employers)
 * @access  Private (Candidate, Employer)
 */
router.post(
  "/request",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  validateRequest(requestVerificationSchema),
  AdminVerificationController.requestVerification
);

/**
 * @route   GET /api/v1/admin-verification/my-status
 * @desc    Get current user's verification status
 * @access  Private (Candidate, Employer)
 */
router.get(
  "/my-status",
  auth(UserType.CANDIDATE, UserType.EMPLOYER),
  AdminVerificationController.getMyVerificationStatus
);

/**
 * @route   GET /api/v1/admin-verification/requests
 * @desc    Get all verification requests with filters
 * @access  Private (Admin only)
 * @query   status, userType, page, limit, sortBy, sortOrder
 */
router.get(
  "/requests",
  auth(UserType.ADMIN),
  validateRequest(getVerificationRequestsSchema),
  AdminVerificationController.getVerificationRequests
);

/**
 * @route   GET /api/v1/admin-verification/:id
 * @desc    Get verification request details by ID
 * @access  Private (Admin only)
 */
router.get(
  "/:id",
  auth(UserType.ADMIN),
  validateRequest(getVerificationByIdSchema),
  AdminVerificationController.getVerificationById
);

/**
 * @route   PATCH /api/v1/admin-verification/:id/status
 * @desc    Update verification status (approve/reject)
 * @access  Private (Admin only)
 */
router.patch(
  "/:id/status",
  auth(UserType.ADMIN),
  validateRequest(updateVerificationStatusSchema),
  AdminVerificationController.updateVerificationStatus
);

export default router;
