import express, { Router } from "express";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  shortlistCandidateSchema,
  removeShortlistedCandidateSchema,
} from "./candidateShortList.dto";
import { CandidateShortListController } from "./candidateShortList.controller";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/candidate-shortlist
 * @desc    Shortlist a candidate
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/",
  auth(),
  validateRequest(shortlistCandidateSchema),
  CandidateShortListController.shortlistCandidate
);

/**
 * @route   GET /api/v1/candidate-shortlist
 * @desc    Get all shortlisted candidates for the authenticated user
 * @access  Private (Candidate & Employer)
 * @query   page, limit, candidateRole
 */
router.get(
  "/",
  auth(),
  CandidateShortListController.getShortlistedCandidates
);

/**
 * @route   GET /api/v1/candidate-shortlist/count
 * @desc    Get count of shortlisted candidates for the authenticated user
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/count",
  auth(),
  CandidateShortListController.getShortlistedCandidatesCount
);

/**
 * @route   GET /api/v1/candidate-shortlist/check/:candidateId
 * @desc    Check if the authenticated user has shortlisted a specific candidate
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/check/:candidateId",
  auth(),
  CandidateShortListController.checkIfCandidateShortlisted
);

/**
 * @route   GET /api/v1/candidate-shortlist/shortlisted-by/:candidateId
 * @desc    Get all users who have shortlisted a specific candidate
 * @access  Private (Candidate & Employer)
 * @query   page, limit, shortlistedByType, shortlistedByRole
 */
router.get(
  "/shortlisted-by/:candidateId",
  auth(),
  CandidateShortListController.getCandidateShortlistedBy
);

/**
 * @route   GET /api/v1/candidate-shortlist/shortlisted-by/:candidateId/count
 * @desc    Get count of users who have shortlisted a specific candidate
 * @access  Private (Candidate & Employer)
 */
router.get(
  "/shortlisted-by/:candidateId/count",
  auth(),
  CandidateShortListController.getCandidateShortlistedByCount
);

/**
 * @route   DELETE /api/v1/candidate-shortlist/:candidateId
 * @desc    Remove a candidate from shortlist
 * @access  Private (Candidate & Employer)
 */
router.delete(
  "/:candidateId",
  auth(),
  validateRequest(removeShortlistedCandidateSchema),
  CandidateShortListController.removeShortlistedCandidate
);

export default router;
