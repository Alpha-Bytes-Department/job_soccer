import { z } from "zod";

/**
 * Validation schema for applying to a job
 */
const applyToJobDto = z.object({
  body: z.object({
    jobId: z.string().min(1, "Job ID is required"),
    resumeUrl: z.string(),
  }),
});

/**
 * Validation schema for getting applications by job
 */
const getApplicationsByJobDto = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z
      .enum(["aiMatchPercentage", "-aiMatchPercentage", "appliedAt", "-appliedAt"])
      .optional(),
  }),
});

export const JobApplyValidation = {
  applyToJobDto,
  getApplicationsByJobDto,
};
