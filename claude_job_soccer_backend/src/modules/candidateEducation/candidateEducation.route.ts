import express, { Router } from "express";
import { CandidateEducationController } from "./candidateEducation.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  addEducationSchema,
  updateEducationSchema,
  removeEducationSchema,
  getEducationsByUserSchema,
  getEducationByIdSchema,
} from "./candidateEducation.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/candidate-education
 * @desc    Add a new education record for a candidate
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/", 
  auth(),
  validateRequest(addEducationSchema),
  CandidateEducationController.addEducation
);

/**
 * @route   POST /api/v1/candidate-education/bulk
 * @desc    Get education records for multiple users
 * @access  Private (Employer & Admin)
 */
router.post(
  "/bulk",
  auth(UserType.EMPLOYER, UserType.ADMIN),
  CandidateEducationController.getEducationsByUsers
);

/**
 * @route   GET /api/v1/candidate-education/user/:userId
 * @desc    Get all education records for a user
 * @access  Private (All authenticated users)
 */
router.get(
  "/user/:userId",
  auth(),
  validateRequest(getEducationsByUserSchema),
  CandidateEducationController.getAllEducationsByUser
);

/**
 * @route   GET /api/v1/candidate-education/:educationId
 * @desc    Get a specific education record by ID
 * @access  Private (All authenticated users)
 */
router.get(
  "/:educationId",
  auth(),
  validateRequest(getEducationByIdSchema),
  CandidateEducationController.getEducationById
);

/**
 * @route   PATCH /api/v1/candidate-education/:educationId
 * @desc    Update an existing education record
 * @access  Private (Candidate & Employer)
 */
router.patch(
  "/:educationId",
  auth(),
  validateRequest(updateEducationSchema),
  CandidateEducationController.updateEducation
);

/**
 * @route   DELETE /api/v1/candidate-education/:educationId
 * @desc    Remove a specific education record
 * @access  Private (Candidate & Employer)
 */
router.delete(
  "/:educationId",
  auth(),
  validateRequest(removeEducationSchema),
  CandidateEducationController.removeEducation
);

export const CandidateEducationRoutes = router;
