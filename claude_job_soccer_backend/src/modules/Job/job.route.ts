import express, { Router } from "express";
import { JobController } from "./job.controller";
import auth from "../../shared/middlewares/auth";
import optionalAuth from "../../shared/middlewares/optionalAuth";
import validateRequest from "../../shared/middlewares/validateRequest";
import { JobValidation } from "./job.dto";
import { UserType } from "../user/user.interface";

const router = express.Router();

/**
 * PUBLIC ROUTES
 */

/**
 * GET /api/v1/
 * 
 * Get all jobs with advanced filtering and pagination
 * 
 * Query params (all optional):
 *   SEARCH:
 *   - searchTerm: string (search in jobTitle, position, location, jobOverview)
 * 
 *   FILTERS:
 *   - jobCategory: string (e.g., "ProfessionalPlayer", "AmateurPlayer", "Coach")
 *   - location: string (e.g., "New York", "London")
 *   - country: string (e.g., "USA", "UK")
 *   - position: string (e.g., "Striker", "Midfielder")
 *   - contractType: "FullTime" | "PartTime | "Contract"
 *   - status: "active" | "closed" | "draft" | "expired" (default: "active")
 *   - creatorRole: string (employer type, e.g., "ProfessionalClub", "Academy")
 *   - creatorId: string (specific employer's ObjectId)
 * 
 *   SALARY RANGE:
 *   - minSalary: number (jobs with max salary >= this value)
 *   - maxSalary: number (jobs with min salary <= this value)
 * 
 *   AI SCORE RANGE:
 *   - minRequiredAiScore: number (0-100)
 *   - maxRequiredAiScore: number (0-100)
 * 
 *   PAGINATION & SORTING:
 *   - page: number (default: 1)
 *   - limit: number (default: 9999)
 *   - sortBy: string (e.g., "-createdAt", "salary.min", "-deadline")
 * 
 * Example: GET /api/v1/jobs?jobCategory=ProfessionalPlayer&location=London&minSalary=50000&page=1&limit=20
 */
router.get(
  "/",
  optionalAuth,
  validateRequest(JobValidation.getAllJobsDto),
  JobController.getAllJobs
);


/**
 * GET /api/v1/job
 * /counts-by-role
 * Get job counts grouped by role for home page display
 * Returns: [{ role: "Professional Player", jobCount: 4 }, ...]
 */
router.get("/counts-by-role", JobController.getJobCountsByRole);

/**
 * GET /api/v1/job
 * /last-four
 * Get the last 4 most recent active jobs
 * Returns: Array of 4 most recent job objects
 */
router.get("/last-four", JobController.getLastFourJobs);

/**
 * GET /api/v1/job
 * /active
 * Get only active jobs with filters
 */
router.get("/active", JobController.getActiveJobs);

/**
 * GET /api/v1/job
 * /trending
 * Get trending/popular jobs based on application count
 * Query params:
 *   - limit: number (default: 10)
 */
router.get("/trending", JobController.getTrendingJobs);

/**
 * GET /api/v1/job
 * /expiring
 * Get jobs expiring soon
 * Query params:
 *   - days: number (default: 7) - look ahead this many days
 */
router.get("/expiring", JobController.getExpiringJobs);

/**
 * GET /api/v1/job
 * /my/jobs
 * Get jobs created by the authenticated user
 * Query params:
 *   - status: "active" | "closed" | "draft" | "expired" (optional)
 */
router.get("/my/jobs", auth(UserType.EMPLOYER), JobController.getMyJobs);

/**
 * GET /api/v1/job/my/stats
 * Get job statistics for the authenticated user
 */
router.get("/my/stats", auth(UserType.EMPLOYER), JobController.getMyJobStats);

/**
 * GET /api/v1/job
 * /employer/:employerId
 * Get all jobs posted by a specific employer
 * Query params:
 *   - status: "active" | "closed" | "draft" | "expired" (optional)
 */
router.get("/employer/:employerId", JobController.getJobsByEmployer);

/**
 * GET /api/v1/job
 * /stats/employer/:employerId
 * Get job statistics for a specific employer
 */
router.get("/stats/employer/:employerId", JobController.getEmployerJobStats);

/**
 * GET /api/v1/job
 * /:id
 * Get a single job by ID
 */
router.get("/:id", JobController.getJobById);

/**
 * PROTECTED ROUTES - Require authentication
 */

/**
 * POST /api/v1/job
 * 
 * Create a new job posting (Employer only)
 */
router.post(
  "/",
  auth(UserType.EMPLOYER),
  validateRequest(JobValidation.createJobDto),
  JobController.createJob
);

/**
 * POST /api/v1/job/by-categories
 * Get jobs by multiple categories (for recommendations)
 * Body:
 *   - categories: string[]
 *   - limit: number (optional, default: 20)
 */
router.post("/by-categories",  JobController.getJobsByCategories);

/**
 * PATCH /api/v1/jobs
 * /:id
 * Update a job (owner only)
 */
router.patch(
  "/:id",
  auth(UserType.EMPLOYER),
  validateRequest(JobValidation.updateJobDto),
  JobController.updateJob
);

/**
 * DELETE /api/v1/jobs
 * /:id
 * Delete a job (soft delete - owner only)
 */
router.delete("/:id", auth(UserType.EMPLOYER), JobController.deleteJob);

/**
 * POST /api/v1/jobs/:id/apply
 * Increment application count for a job (when someone applies)
 */
router.post("/:id/apply", auth(UserType.CANDIDATE), JobController.incrementApplicationCount);

/**
 * ADMIN ROUTES
 */

/**
 * POST /api/v1/jobs
 * /bulk-update-status
 * Bulk update job status (admin only)
 * Body:
 *   - jobIds: string[]
 *   - status: "active" | "closed" | "draft" | "expired"
 */
router.post(
  "/bulk-update-status",
  auth(UserType.ADMIN),
  JobController.bulkUpdateStatus
);

/**
 * POST /api/v1/jobs
 * /expire-old
 * Expire old jobs past their deadline (admin/cron job)
 */
router.post("/expire-old", auth(UserType.ADMIN), JobController.expireOldJobs);

export const JobRoutes: Router = router;
