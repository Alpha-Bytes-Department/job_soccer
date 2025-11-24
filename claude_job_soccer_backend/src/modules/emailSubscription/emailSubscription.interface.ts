import { Types } from "mongoose";

export type TEmailSubscription = {
  _id?: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};
