import { Types } from "mongoose";

export type TAgentHiringStatus = "pending" | "accepted" | "rejected" | "completed";

export interface IAgentHiring {
  agentUserId: Types.ObjectId;
  hiredByUserId: Types.ObjectId;
  hiredByUserType: "candidate" | "employer";
  hiredByUserRole: string;
  status: TAgentHiringStatus;
  hiredAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
