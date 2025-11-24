import { Router, type IRouter } from "express";
import { DashboardController } from "./dashboard.controller";
import auth from "../../shared/middlewares/auth";

const router: IRouter = Router();

/**
 * ADMIN DASHBOARD ROUTES
 * All routes require admin authentication
 */

/**
 * GET /api/v1/dashboard/user-counts
 * 
 * Get total user counts including paid and unpaid users
 * 
 * Auth: Required (admin only)
 * 
 * Response:
 * {
 *   totalUsers: number,
 *   paidUsers: number,
 *   unpaidUsers: number
 * }
 */
router.get(
  "/user-counts",
  auth("admin"),
  DashboardController.getUserCounts
);

/**
 * GET /api/v1/dashboard/monthly-income
 * 
 * Get monthly income for the current year (January to December)
 * Future months will show income as 0
 * 
 * Auth: Required (admin only)
 * 
 * Response: Array of 12 months with income data
 * [
 *   { month: "January", income: 2500.00 },
 *   { month: "February", income: 3200.50 },
 *   ...
 * ]
 */
router.get(
  "/monthly-income",
  auth("admin"),
  DashboardController.getMonthlyIncome
);

/**
 * GET /api/v1/dashboard/user-list
 * 
 * Get paginated list of users with advanced filtering
 * 
 * Auth: Required (admin only)
 * 
 * Query params (all optional):
 *   - page: number (default: 1)
 *   - limit: number (default: 10)
 *   - search: string (search by name or email)
 *   - userType: "candidate" | "employer" (filter by user type)
 *   - subscriptionType: "paid" | "free" (filter by subscription status)
 *   - role: string (filter by specific role)
 * 
 * Response:
 * {
 *   users: [
 *     {
 *       name: string,
 *       firstName: string,
 *       lastName: string,
 *       email: string,
 *       userType: string,
 *       role: string,
 *       subscriptionStatus: "paid" | "free"
 *     }
 *   ],
 *   pagination: {
 *     currentPage: number,
 *     totalPages: number,
 *     totalUsers: number,
 *     limit: number
 *   }
 * }
 * 
 * Example: GET /api/v1/dashboard/user-list?userType=candidate&subscriptionType=paid&page=1&limit=20
 */
router.get(
  "/user-list",
  auth("admin"),
  DashboardController.getUserList
);

/**
 * GET /api/v1/dashboard/user/:userId
 * 
 * Get detailed information about a specific user
 * Includes user profile and payment history (last 10 payments)
 * 
 * Auth: Required (admin only)
 * 
 * Params:
 *   - userId: string (required) - MongoDB ObjectId of the user
 * 
 * Response:
 * {
 *   user: {
 *      Full user profile including subscription details
 *   },
 *   paymentHistory: [
 *     {
 *       amount: number,
 *       currency: string,
 *       status: string,
 *       paymentMethod: string,
 *       paidAt: Date
 *     }
 *   ]
 * }
 */
router.get(
  "/user/:userId",
  auth("admin"),
  DashboardController.getUserDetails
);

/**
 * GET /api/v1/dashboard/user-statistics
 * 
 * Get user statistics with month-over-month growth percentage
 * Includes total, paid, and free users with their growth rates
 * 
 * Auth: Required (admin only)
 * 
 * Response:
 * {
 *   total: {
 *     count: number,
 *     growth: number (percentage)
 *   },
 *   paid: {
 *     count: number,
 *     growth: number (percentage)
 *   },
 *   free: {
 *     count: number,
 *     growth: number (percentage)
 *   }
 * }
 */
router.get(
  "/user-statistics",
  auth("admin"),
  DashboardController.getUserStatistics
);

/**
 * GET /api/v1/dashboard/payment-statistics
 * 
 * Get comprehensive payment statistics
 * Includes total payments, successful payments, and cancelled/failed payments
 * 
 * Auth: Required (admin only)
 * 
 * Response:
 * {
 *   total: {
 *     count: number (all payment attempts),
 *     revenue: number (total revenue from successful payments)
 *   },
 *   paid: {
 *     count: number (successful payments),
 *     revenue: number (total revenue)
 *   },
 *   cancelled: {
 *     count: number (failed/cancelled payments),
 *     revenue: number (always 0)
 *   }
 * }
 */
router.get(
  "/payment-statistics",
  auth("admin"),
  DashboardController.getPaymentStatistics
);

export const DashboardRoutes: IRouter = router;
