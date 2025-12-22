import { Types } from "mongoose";

export interface IAgentRating {
  agentUserId: Types.ObjectId;
  ratedByUserId: Types.ObjectId;
  ratedByUserType: "candidate" | "employer";
  ratedByUserRole: string;
  rating: number; // 1-5
  createdAt: Date;
  updatedAt: Date;
}
