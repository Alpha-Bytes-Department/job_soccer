import { z } from "zod";

/**
 * Validation schema for searching candidates
 */
const searchCandidatesDto = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    role: z
      .enum([
        "Professional Player",
        "Amateur Player",
        "High School Player",
        "College/University Player",
        "On field staff",
        "Office Staff",
      ])
      .optional(),
    country: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
  }),
});

export const CandidateValidation = {
  searchCandidatesDto,
};
