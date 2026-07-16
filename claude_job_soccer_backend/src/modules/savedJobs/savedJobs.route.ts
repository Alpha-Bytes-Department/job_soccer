import express, { Router } from "express";
import { SavedJobController } from "./savedJobs.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import { addSavedJobSchema, removeSavedJobSchema } from "./savedJobs.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/saved-jobs
 * @desc    Add a job to saved jobs
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(),
  validateRequest(addSavedJobSchema),
  SavedJobController.addSavedJob
);

/**
 * @route   GET /api/v1/saved-jobs
 * @desc    Get all saved jobs for authenticated user
 * @access  Private (Candidate & Employer)
 * @query   page, limit, userType, userRole
 */
router.get(
  "/",
  auth(),
  SavedJobController.getSavedJobs
);

/**
 * @route   GET /api/v1/saved-jobs/count
 * @desc    Get count of saved jobs
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/count",
  auth(),
  SavedJobController.getSavedJobsCount
);

/**
 * @route   GET /api/v1/saved-jobs/check/:jobId
 * @desc    Check if a job is saved
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/check/:jobId",
  auth(),
  SavedJobController.checkIfJobSaved
);

/**
 * @route   DELETE /api/v1/saved-jobs/:jobId
 * @desc    Remove a job from saved jobs
 * @access  Private (Candidate & Employer)
 */
router.delete(
  "/:jobId",
  auth(),
  validateRequest(removeSavedJobSchema),
  SavedJobController.removeSavedJob
);

export default router;
