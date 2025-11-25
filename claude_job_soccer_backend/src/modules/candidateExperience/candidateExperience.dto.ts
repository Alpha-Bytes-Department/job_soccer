import { z } from "zod";

export const addExperienceSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    employmentType: z.enum(["FullTime", "PartTime","Contract"], {
      message: "Employment type must be FullTime or PartTime or Contract",
    }),
    club: z.string().min(1, "Club name is required"),
    location: z.string().min(1, "Location is required"),
    isCurrentlyWorking: z.boolean(),
    startMonth: z.string().min(1, "Start month is required"),
    startYear: z.number().min(1900).max(new Date().getFullYear() + 1),
    endMonth: z.string().optional(),
    endYear: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
    description: z.string().optional(),
  }).refine(
    (data) => {
      // If currently working, endMonth and endYear should not be provided
      if (data.isCurrentlyWorking) {
        return !data.endMonth && !data.endYear;
      }
      return true;
    },
    {
      message: "End date cannot be provided for currently working positions",
      path: ["isCurrentlyWorking"],
    }
  ),
});

export const updateExperienceSchema = z.object({
  params: z.object({
    experienceId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid experience ID format"),
  }),
  body: z.object({
    title: z.string().min(1, "Title is required").optional(),
    employmentType: z.enum(["FullTime", "PartTime","Contract"], {
      message: "Employment type must be FullTime or PartTime or Contract",
    }).optional(),
    club: z.string().min(1, "Club name is required").optional(),
    location: z.string().min(1, "Location is required").optional(),
    isCurrentlyWorking: z.boolean().optional(),
    startMonth: z.string().min(1, "Start month is required").optional(),
    startYear: z
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional(),
    endMonth: z.string().optional(),
    endYear: z
      .number()
      .min(1900)
      .max(new Date().getFullYear() + 1)
      .optional(),
    description: z.string().optional(),
  }).refine(
    (data) => {
      // If currently working is set to true, endMonth and endYear should not be provided
      if (data.isCurrentlyWorking === true) {
        return !data.endMonth && !data.endYear;
      }
      return true;
    },
    {
      message: "End date cannot be provided for currently working positions",
      path: ["isCurrentlyWorking"],
    }
  ),
});

export const removeExperienceSchema = z.object({
  params: z.object({
    experienceId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid experience ID format"),
  }),
});

export const getExperiencesByUserSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  }),
});

export const getExperienceByIdSchema = z.object({
  params: z.object({
    experienceId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid experience ID format"),
  }),
});

export const getExperiencesByProfileIdSchema = z.object({
  params: z.object({
    profileId: z.string().min(1, "Profile ID is required"),
  }),
});

export type TAddExperience = z.infer<typeof addExperienceSchema>;
export type TUpdateExperience = z.infer<typeof updateExperienceSchema>;
export type TRemoveExperience = z.infer<typeof removeExperienceSchema>;
export type TGetExperiencesByUser = z.infer<typeof getExperiencesByUserSchema>;
export type TGetExperienceById = z.infer<typeof getExperienceByIdSchema>;
export type TGetExperiencesByProfileId = z.infer<typeof getExperiencesByProfileIdSchema>;
