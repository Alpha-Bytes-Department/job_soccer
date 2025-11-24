import { z } from "zod";

export const subscribeEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

export const unsubscribeEmailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  }),
});

export type TSubscribeEmail = z.infer<typeof subscribeEmailSchema>;
export type TUnsubscribeEmail = z.infer<typeof unsubscribeEmailSchema>;
