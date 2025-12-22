import { model, Schema } from "mongoose";
import { IAgentHiring, TAgentHiringStatus } from "./agentHiring.interface";

const agentHiringSchema = new Schema<IAgentHiring>(
  {
    agentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hiredByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hiredByUserType: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
    },
    hiredByUserRole: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
      required: true,
      index: true,
    },
    hiredAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound indexes for efficient querying
// Index for finding agent's hirings
agentHiringSchema.index({ agentUserId: 1, status: 1, createdAt: -1 });

// Index for finding user's hirings
agentHiringSchema.index({ hiredByUserId: 1, status: 1, createdAt: -1 });

// Index for checking active hirings between user and agent
agentHiringSchema.index({ agentUserId: 1, hiredByUserId: 1, status: 1 });

// Index for efficiently querying by status and date
agentHiringSchema.index({ status: 1, createdAt: -1 });

export const AgentHiring = model<IAgentHiring>("AgentHiring", agentHiringSchema);
