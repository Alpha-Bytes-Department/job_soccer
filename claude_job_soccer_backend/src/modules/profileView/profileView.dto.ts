import { z } from "zod";

const trackProfileViewSchema = z.object({
  body: z.object({
    profileOwnerId: z.string().min(1, "Profile owner ID is required"),
  }),
});

const getProfileViewsQuerySchema = z.object({
  query: z.object({
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 10)),
  }),
});

export const ProfileViewValidation = {
  trackProfileViewSchema,
  getProfileViewsQuerySchema,
};
