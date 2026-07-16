import express, { Router } from "express";
import { CandidateLicensesAndCertificationController } from "./candidateLicensesAndCertification.controller";
import auth from "../../shared/middlewares/auth";
import validateRequest from "../../shared/middlewares/validateRequest";
import {
  addLicenseAndCertificationSchema,
  updateLicenseAndCertificationSchema,
  removeLicenseAndCertificationSchema,
  getLicensesAndCertificationsByUserSchema,
  getLicenseAndCertificationByIdSchema,
} from "./candidateLicensesAndCertification.dto";
import { UserType } from "../user/user.interface";

const router: Router = express.Router();

/**
 * @route   POST /api/v1/candidate-licenses-and-certifications
 * @desc    Add a new license and certification record for a candidate
 * @access  Private (Candidate & Employer)
 */
router.post(
  "/", 
  auth(),
  validateRequest(addLicenseAndCertificationSchema),
  CandidateLicensesAndCertificationController.addLicenseAndCertification
);

/**
 * @route   POST /api/v1/candidate-licenses-and-certifications/bulk
 * @desc    Get license and certification records for multiple users
 * @access  Private (Employer & Admin)
 */
router.post(
  "/bulk",
  auth(UserType.EMPLOYER, UserType.ADMIN),
  CandidateLicensesAndCertificationController.getLicensesAndCertificationsByUsers
);

/**
 * @route   GET /api/v1/candidate-licenses-and-certifications/user/:userId
 * @desc    Get all license and certification records for a user
 * @access  Private (All authenticated users)
 */
router.get(
  "/user/:userId",
  auth(),
  validateRequest(getLicensesAndCertificationsByUserSchema),
  CandidateLicensesAndCertificationController.getAllLicensesAndCertificationsByUser
);

/**
 * @route   GET /api/v1/candidate-licenses-and-certifications/:licenseId
 * @desc    Get a specific license and certification record by ID
 * @access  Private (All authenticated users)
 */
router.get(
  "/:licenseId",
  auth(),
  validateRequest(getLicenseAndCertificationByIdSchema),
  CandidateLicensesAndCertificationController.getLicenseAndCertificationById
);

/**
 * @route   PATCH /api/v1/candidate-licenses-and-certifications/:licenseId
 * @desc    Update an existing license and certification record
 * @access  Private (Candidate & Employer)
 */
router.patch(
  "/:licenseId",
  auth(),
  validateRequest(updateLicenseAndCertificationSchema),
  CandidateLicensesAndCertificationController.updateLicenseAndCertification
);

/**
 * @route   DELETE /api/v1/candidate-licenses-and-certifications/:licenseId
 * @desc    Remove a specific license and certification record
 * @access  Private (Candidate & Employer)
 */
router.delete(
  "/:licenseId",
  auth(),
  validateRequest(removeLicenseAndCertificationSchema),
  CandidateLicensesAndCertificationController.removeLicenseAndCertification
);

export const CandidateLicensesAndCertificationRoutes = router;
