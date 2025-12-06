import { z } from "zod";

export const createNotificationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    description: z.string().min(1, "Description is required").max(1000, "Description too long"),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  }),
});

export const getNotificationByIdSchema = z.object({
  params: z.object({
    notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID format"),
  }),
});

export const markAsReadSchema = z.object({
  params: z.object({
    notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID format"),
  }),
});

export const deleteNotificationSchema = z.object({
  params: z.object({
    notificationId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid notification ID format"),
  }),
});

export type TCreateNotification = z.infer<typeof createNotificationSchema>;
export type TGetNotificationById = z.infer<typeof getNotificationByIdSchema>;
export type TMarkAsRead = z.infer<typeof markAsReadSchema>;
export type TDeleteNotification = z.infer<typeof deleteNotificationSchema>;
