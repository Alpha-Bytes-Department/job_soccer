import { z } from "zod";
import { CandidateRole } from "../user/user.interface";

/**
 * Validation schema for creating a new job
 */
const createJobDto = z.object({
  body: z.object({
    jobTitle: z.string().min(3, "Job title must be at least 3 characters"),
    location: z.string().min(2, "Location is required"),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
    jobOverview: z
      .string()
      .min(10, "Job overview must be at least 10 characters"),
    jobCategory: z.enum([
      CandidateRole.PROFESSIONAL_PLAYER,
      CandidateRole.AMATEUR_PLAYER,
      CandidateRole.HIGH_SCHOOL,
      CandidateRole.COLLEGE_UNIVERSITY,
      CandidateRole.ON_FIELD_STAFF,
      CandidateRole.OFFICE_STAFF,
    ] as const, {
      message: "Invalid candidate role for job category",
    }),
    position: z.string().min(2, "Position is required"),
    contractType: z.enum(["FullTime", "PartTime"]),
    salary: z
      .object({
        min: z.number().min(0, "Minimum salary must be non-negative"),
        max: z.number().min(0, "Maximum salary must be non-negative"),
      })
      .refine((data) => data.max >= data.min, {
        message:
          "Maximum salary must be greater than or equal to minimum salary",
      }),
    experience: z.enum(["Entry Level", "Intermediate", "Mid-Level", "Mid-Senior", "Senior"], {
      message: "Invalid experience level",
    }),
    requirements: z
      .string()
      .min(10, "Requirements must be at least 10 characters"),
    responsibilities: z
      .string()
      .min(10, "Responsibilities must be at least 10 characters"),
    requiredAiScore: z
      .number()
      .min(0, "Required AI Score must be at least 0")
      .max(100, "Required AI Score cannot exceed 100")
      .optional(),                                                                                                                             
    requiredSkills: z
      .string()
      .min(5, "Required skills must be at least 5 characters"),
    additionalRequirements: z.string().optional(),
    country: z.string().optional(),
    status: z.enum(["active", "closed", "draft", "expired"]).optional(),
  }).strict(),
});

/**
 * Validation schema for updating a job
 */
const updateJobDto = z.object({
  body: z.object({
    jobTitle: z.string().min(3).optional(),
    location: z.string().min(2).optional(),
    deadline: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
      })
      .optional(),
    jobOverview: z.string().min(10).optional(),
    jobCategory: z.enum([
      CandidateRole.PROFESSIONAL_PLAYER,
      CandidateRole.AMATEUR_PLAYER,
      CandidateRole.HIGH_SCHOOL,
      CandidateRole.COLLEGE_UNIVERSITY,
      CandidateRole.ON_FIELD_STAFF,
      CandidateRole.OFFICE_STAFF,
    ] as const, {
      message: "Invalid candidate role for job category",
    }).optional(),
    position: z.string().min(2).optional(),
    contractType: z.enum(["FullTime", "PartTime"]).optional(),
    salary: z
      .object({
        min: z.number().min(0).optional(),
        max: z.number().min(0).optional(),
      })
      .optional(),
    experience: z.enum(["Entry Level", "Intermediate", "Mid-Level", "Mid-Senior", "Senior"], {
      message: "Invalid experience level",
    }).optional(),
    requirements: z.string().min(10).optional(),
    responsibilities: z.string().min(10).optional(),
    requiredSkills: z.string().min(5).optional(),
    additionalRequirements: z.string().optional(),
    requiredAiScore: z
      .number()
      .min(0, "Required AI Score must be at least 0")
      .max(100, "Required AI Score cannot exceed 100")
      .optional(),
    country: z.string().optional(),
    status: z.enum(["active", "closed", "draft", "expired"]).optional(),
  }).strict(),
});

/**
 * Validation schema for getting all jobs with filters
 */
const getAllJobsDto = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    jobCategory: z.enum([
      CandidateRole.PROFESSIONAL_PLAYER,
      CandidateRole.AMATEUR_PLAYER,
      CandidateRole.HIGH_SCHOOL,
      CandidateRole.COLLEGE_UNIVERSITY,
      CandidateRole.ON_FIELD_STAFF,
      CandidateRole.OFFICE_STAFF,
    ] as const).optional(),
    location: z.string().optional(),
    country: z.string().optional(),
    contractType: z.enum(["FullTime", "PartTime"]).optional(),
    position: z.string().optional(),
    experience: z.enum(["Entry Level", "Intermediate", "Mid-Level", "Mid-Senior", "Senior"]).optional(),
    minSalary: z.string().optional(),
    maxSalary: z.string().optional(),
    // AI Score filtering - can use either level (Low, Medium, Good, High) or custom range
    aiScoreLevel: z.enum(["Low", "Medium", "Good", "High"]).optional(),
    minRequiredAiScore: z.string().optional(),
    maxRequiredAiScore: z.string().optional(),
    // Date filtering - filter by when job was created
    dateFilter: z.enum(["Last Week", "This Month", "Any Time"]).optional(),
    creatorRole: z.string().optional(),
    creatorId: z.string().optional(),
    status: z.enum(["active", "closed", "draft", "expired"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
  }),
});

export const JobValidation = {
  createJobDto,
  updateJobDto,
  getAllJobsDto,
};
