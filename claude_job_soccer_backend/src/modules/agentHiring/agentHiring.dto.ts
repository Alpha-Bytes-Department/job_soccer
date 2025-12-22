import { z } from "zod";

export const createAgentHiringSchema = z.object({
  body: z.object({
    agentUserId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid agent user ID format"),
  }),
});

export const updateHiringStatusSchema = z.object({
  params: z.object({
    hiringId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid hiring ID format"),
  }),
  body: z.object({
    status: z.enum(["accepted", "rejected", "completed"]),
  }),
});

export const getHiringByIdSchema = z.object({
  params: z.object({
    hiringId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid hiring ID format"),
  }),
});

export type TCreateAgentHiring = z.infer<typeof createAgentHiringSchema>;
export type TUpdateHiringStatus = z.infer<typeof updateHiringStatusSchema>;
export type TGetHiringById = z.infer<typeof getHiringByIdSchema>;
