import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JobService } from "./job.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Create a new job posting
 * POST /api/v1/jobs
 */
const createJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const jobData = {
    ...req.body,
    creator: {
      creatorId: userId,
      creatorRole: userRole,
    },
  };

  const result = await JobService.createJob(jobData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Job created successfully",
    data: result,
  });
});

/**
 * Get all jobs with advanced filtering and pagination
 * GET /api/v1/jobs
 * Semi-private: Authenticated users get filtered results (excludes saved/applied jobs)
 */
const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await JobService.getAllJobs(req.query, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Jobs retrieved successfully",
    data: result.data,
    meta: {
      page: result.meta.page,
      limit: result.meta.limit,
      totalPage: result.meta.totalPages,
      total: result.meta.total,
    },
  });
});

/**
 * Get active jobs with filters
 * GET /api/v1/jobs/active
 */
const getActiveJobs = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    jobCategory: req.query.jobCategory as string,
    location: req.query.location as string,
    country: req.query.country as string,
    contractType: req.query.contractType as string,
    minSalary: req.query.minSalary ? Number(req.query.minSalary) : undefined,
    maxSalary: req.query.maxSalary ? Number(req.query.maxSalary) : undefined,
    employerRole: req.query.employerRole as string,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    sortBy: req.query.sortBy as string,
  };

  const result = await JobService.getActiveJobs(filters);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Active jobs retrieved successfully",
    data: result.data,
    meta: {
      page: result.meta.currentPage,
      limit: result.meta.limit,
      totalPage: result.meta.totalPages,
      total: result.meta.total,
    },
  });
});

/**
 * Get trending/popular jobs
 * GET /api/v1/jobs/trending
 */
const getTrendingJobs = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await JobService.getTrendingJobs(limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Trending jobs retrieved successfully",
    data: result.data,
  });
});

/**
 * Get jobs expiring soon
 * GET /api/v1/jobs/expiring
 */
const getExpiringJobs = catchAsync(async (req: Request, res: Response) => {
  const daysAhead = req.query.days ? Number(req.query.days) : undefined;
  const result = await JobService.getExpiringJobs(daysAhead);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Expiring jobs retrieved successfully",
    data: result.data,
  });
});

/**
 * Get single job by ID
 * GET /api/v1/jobs/:id
 * Semi-private: Authenticated users get isApplied/isSaved fields
 */
const getJobById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await JobService.getJobById(req.params.id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Job retrieved successfully",
    data: result,
  });
});

/**
 * Get jobs by employer ID
 * GET /api/v1/jobs/employer/:employerId
 */
const getJobsByEmployer = catchAsync(async (req: Request, res: Response) => {
  const { employerId } = req.params;
  const status = req.query.status as any;

  const result = await JobService.getJobsByEmployer(employerId, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employer jobs retrieved successfully",
    data: result.data,
  });
});

/**
 * Get my jobs (jobs created by the authenticated user)
 * GET /api/v1/jobs/my-jobs
 */
const getMyJobs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const status = req.query.status as any;

  const result = await JobService.getJobsByEmployer(userId!, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My jobs retrieved successfully",
    data: result.data
  });
});

/**
 * Get jobs by multiple categories
 * POST /api/v1/jobs/by-categories
 */
const getJobsByCategories = catchAsync(async (req: Request, res: Response) => {
  const { categories, limit } = req.body;

  const result = await JobService.getJobsByCategories(categories, limit);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Jobs retrieved successfully",
    data: result.data,
  });
});

/**
 * Get employer job statistics
 * GET /api/v1/jobs/stats/employer/:employerId
 */
const getEmployerJobStats = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getEmployerJobStats(req.params.employerId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Employer job statistics retrieved successfully",
    data: result.data,
  });
});

/**
 * Get my job statistics
 * GET /api/v1/jobs/stats/my-stats
 */
const getMyJobStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await JobService.getEmployerJobStats(userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "My job statistics retrieved successfully",
    data: result.data,
  });
});

/**
 * Update a job
 * PATCH /api/v1/jobs/:id
 */
const updateJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await JobService.updateJob(req.params.id, req.body, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Job updated successfully",
    data: result,
  });
});

/**
 * Delete a job (soft delete)
 * DELETE /api/v1/jobs/:id
 */
const deleteJob = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await JobService.deleteJob(req.params.id, userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

/**
 * Increment application count for a job
 * POST /api/v1/jobs/:id/apply
 */
const incrementApplicationCount = catchAsync(
  async (req: Request, res: Response) => {
    const result = await JobService.incrementApplicationCount(req.params.id);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: result.message,
      data: null,
    });
  }
);

/**
 * Bulk update job status (admin only)
 * POST /api/v1/jobs/bulk-update-status
 */
const bulkUpdateStatus = catchAsync(async (req: Request, res: Response) => {
  const { jobIds, status } = req.body;

  const result = await JobService.bulkUpdateStatus(jobIds, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: { modifiedCount: result.modifiedCount },
  });
});

/**
 * Expire old jobs (admin/cron job)
 * POST /api/v1/jobs/expire-old
 */
const expireOldJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.expireOldJobs();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: { count: result.count },
  });
});

/**
 * Get job counts grouped by role for home page
 * GET /api/v1/jobs/counts-by-role
 */
const getJobCountsByRole = catchAsync(async (req: Request, res: Response) => {
  const result = await JobService.getJobCountsByRole();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Job counts by role retrieved successfully",
    data: result,
  });
});

/**
 * Get the last 4 jobs (most recent active jobs)
 * GET /api/v1/jobs/last-four
 * Semi-private: Authenticated users get isApplied/isSaved fields
 */
const getLastFourJobs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await JobService.getLastFourJobs(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Last 4 jobs retrieved successfully",
    data: result,
  });
});

export const JobController = {
  createJob,
  getAllJobs,
  getActiveJobs,
  getTrendingJobs,
  getExpiringJobs,
  getJobById,
  getJobsByEmployer,
  getMyJobs,
  getJobsByCategories,
  getEmployerJobStats,
  getMyJobStats,
  updateJob,
  deleteJob,
  incrementApplicationCount,
  bulkUpdateStatus,
  expireOldJobs,
  getJobCountsByRole,
  getLastFourJobs,
};
