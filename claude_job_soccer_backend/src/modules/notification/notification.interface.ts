import { Types } from "mongoose";

export type TNotification = {
  _id?: Types.ObjectId;
  title: string;
  description: string;
  userId: Types.ObjectId;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
