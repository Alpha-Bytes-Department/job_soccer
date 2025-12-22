import { z } from "zod";

export const createAgentRatingSchema = z.object({
  body: z.object({
    agentUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid agent user ID format"),
    rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  }),
});

export const getAgentRatingsByAgentIdSchema = z.object({
  params: z.object({
    agentUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid agent user ID format"),
  }),
});

export const checkUserRatedAgentSchema = z.object({
  params: z.object({
    agentUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid agent user ID format"),
  }),
});

export type TCreateAgentRating = z.infer<typeof createAgentRatingSchema>;
export type TGetAgentRatingsByAgentId = z.infer<typeof getAgentRatingsByAgentIdSchema>;
export type TCheckUserRatedAgent = z.infer<typeof checkUserRatedAgentSchema>;
