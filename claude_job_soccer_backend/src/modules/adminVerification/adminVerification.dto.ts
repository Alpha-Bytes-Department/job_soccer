import { z } from "zod";

// Schema for requesting verification
export const requestVerificationSchema = z.object({
  body: z.object({
    // No body needed - userId comes from auth middleware
  }),
});

// Schema for getting verification requests with filters
export const getVerificationRequestsSchema = z.object({
  query: z.object({
    status: z
      .enum(["pending", "approved", "rejected"])
      .optional(),
    userType: z
      .enum(["candidate", "employer"])
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform(Number)
      .optional(),
    sortBy: z
      .string()
      .optional(),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional(),
  }),
});

// Schema for getting verification request by ID
export const getVerificationByIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid verification ID format"),
  }),
});

// Schema for updating verification status (approve/reject)
export const updateVerificationStatusSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid verification ID format"),
  }),
  body: z.object({
    status: z.enum(["approved", "rejected"]),
  }),
});

export type TRequestVerification = z.infer<typeof requestVerificationSchema>;
export type TGetVerificationRequests = z.infer<typeof getVerificationRequestsSchema>;
export type TGetVerificationById = z.infer<typeof getVerificationByIdSchema>;
export type TUpdateVerificationStatus = z.infer<typeof updateVerificationStatusSchema>;
