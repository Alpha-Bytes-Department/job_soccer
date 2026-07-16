import express, { Router } from "express";
import { JobApplyController } from "./jobApply.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import { JobApplyValidation } from "./jobApply.dto";
import { UserType } from "../user/user.interface";

const router = express.Router();

/**
 * CANDIDATE ROUTES
 */

/**
 * POST /api/v1/job-applications/apply
 * Apply to a job
 * Body:
 *   - jobId: string (required)
 *   - resumeUrl: string (optional - URL to uploaded resume)
 */
router.post(
  "/apply",
  auth(),
  validateRequest(JobApplyValidation.applyToJobDto),
  JobApplyController.applyToJob
);

/**
 * GET /api/v1/job-applications/my-applications
 * Get candidate's own applications
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 */
router.get(
  "/my-applications",
  auth(),
  JobApplyController.getCandidateApplications
);

/**
 * DELETE /api/v1/job-applications/:id
 * Withdraw an application
 */
router.delete(
  "/:id",
  auth(),
  JobApplyController.deleteApplication
);

/**
 * EMPLOYER ROUTES
 */

/**
 * GET /api/v1/job-applications/job/:jobId
 * Get all applications for a specific job
 * Query params:
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 *   - sortBy: "aiMatchPercentage" | "-aiMatchPercentage" | "appliedAt" | "-appliedAt"
 *             (default: -aiMatchPercentage - highest match first)
 * 
 * Response format:
 * {
 *   "success": true,
 *   "message": "Applications retrieved successfully",
 *   "data": [
 *     {
 *       "_id": "application_id",
 *       "applicantName": "John Doe",
 *       "applicantEmail": "john@example.com",
 *       "applicantProfileImage": "url",
 *       "candidateId": "candidate_id",
 *       "candidateRole": "Professional Player",
 *       "aiMatchPercentage": 85,
 *       "resumeUrl": "https://...",
 *       "appliedAt": "2025-11-07T10:30:00.000Z"
 *     }
 *   ],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 25,
 *     "totalPages": 3
 *   }
 * }
 */
router.get(
  "/job/:jobId",
  auth(),
  validateRequest(JobApplyValidation.getApplicationsByJobDto),
  JobApplyController.getApplicationsByJob
);

/**
 * GET /api/v1/job-applications/applicant/:candidateId
 * Get full profile details of an applicant
 * For employers to view complete candidate information
 * 
 * Response includes:
 *   - Basic user info (name, email, profile image, AI score)
 *   - Complete role-specific profile data
 */
router.get(
  "/applicant/:candidateId",
  auth(),
  JobApplyController.getApplicantProfile
);

export const JobApplyRoutes: Router = router;
