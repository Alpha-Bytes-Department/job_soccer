import express, { Router } from "express";
import { EmployerController } from "./employer.controller";
import optionalAuth from "../../shared/middlewares/optionalAuth";

const router = express.Router();

/**
 * GET /api/v1/employers/search
 * Search employers by name, category, and country
 * Semi-private: Authenticated users get filtered results
 * Query params:
 *   - searchTerm: string (search in firstName, lastName)
 *   - role: string (employer category/role)
 *   - country: string (filter by country)
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 *   - sortBy: string (default: -createdAt)
 */
router.get("/search", optionalAuth, EmployerController.searchEmployers);

/**
 * GET /api/v1/employers/featured
 * Get featured employers grouped by category
 * Returns max 4 employers per category
 * Response format: 
 * {
 *   "ProfessionalClub": [{...}, {...}],
 *   "Academy": [{...}, {...}],
 *   "AmateurClub": [{...}, {...}],
 *   "ConsultingCompany": [{...}, {...}],
 *   "HighSchool": [{...}, {...}],
 *   "CollegeUniversity": [{...}, {...}],
 *   "Agent": [{...}, {...}]
 * }
 */

router.get("/featured", EmployerController.getFeaturedEmployers);

/**
 * GET /api/v1/employers/:id
 * Get employer by ID with full profile details
 */
router.get("/:id", EmployerController.getEmployerById);

export const EmployerRoutes: Router = router;
