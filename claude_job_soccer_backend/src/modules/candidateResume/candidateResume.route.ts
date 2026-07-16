import express, { Router } from "express";
import { CandidateResumeController } from "./candidateResume.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  addResumeSchema,
  removeResumeSchema,
  getResumesSchema,
  getResumeByIdSchema,
  setActiveResumeSchema,
} from "./candidateResume.dto";
import { UserType } from "../user/user.interface";
import fileUploadHandler from "../../shared/middlewares/fileUploadHandler";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/candidate-resume
 * @desc    Add a new resume for a candidate
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(),
  fileUploadHandler,
  validateRequest(addResumeSchema),
  CandidateResumeController.addResume
);

/**
 * @route   POST /api/v1/candidate-resume/bulk/active
 * @desc    Get active resumes for multiple users
 * @access  Private (Employer & Admin)
 */
router.post(
  "/bulk/active",
  auth(UserType.EMPLOYER, UserType.ADMIN),
  CandidateResumeController.getActiveResumesByUsers
);

/**
 * @route   POST /api/v1/candidate-resume/bulk
 * @desc    Get all resumes for multiple users
 * @access  Private (Employer & Admin)
 */
router.post(
  "/bulk",
  auth(UserType.EMPLOYER, UserType.ADMIN),
  CandidateResumeController.getResumesByUsers
);

/**
 * @route   GET /api/v1/candidate-resume/user/:userId/check
 * @desc    Check if a user has any resumes
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/user/:userId/check",
  auth(),
  CandidateResumeController.checkHasResume
);

/**
 * @route   GET /api/v1/candidate-resume/user/:userId/active
 * @desc    Get active resume for a user
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/user/:userId/active",
  auth(),
  validateRequest(getResumesSchema),
  CandidateResumeController.getActiveResume
);

/**
 * @route   GET /api/v1/candidate-resume/user/:userId
 * @desc    Get all resumes for a user
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/user/:userId",
  auth(),
  validateRequest(getResumesSchema),
  CandidateResumeController.getAllResumes
);

/**
 * @route   PATCH /api/v1/candidate-resume/:resumeId/activate
 * @desc    Set a resume as active
 * @access  Private (Candidate)
 */
router.patch(
  "/:resumeId/activate",
  auth(UserType.CANDIDATE),
  validateRequest(setActiveResumeSchema),
  CandidateResumeController.setActiveResume
);

/**
 * @route   GET /api/v1/candidate-resume/:resumeId
 * @desc    Get a specific resume by ID
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/:resumeId",
  auth(),
  validateRequest(getResumeByIdSchema),
  CandidateResumeController.getResumeById
);

/**
 * @route   DELETE /api/v1/candidate-resume/:resumeId
 * @desc    Remove a specific resume
 * @access  Private (Candidate)
 */
router.delete(
  "/:resumeId",
  auth(UserType.CANDIDATE),
  validateRequest(removeResumeSchema),
  CandidateResumeController.removeResume
);

export default router;
