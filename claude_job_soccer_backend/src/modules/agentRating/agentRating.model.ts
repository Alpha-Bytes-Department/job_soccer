import { model, Schema } from "mongoose";
import { IAgentRating } from "./agentRating.interface";

const agentRatingSchema = new Schema<IAgentRating>(
  {
    agentUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ratedByUserType: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
    },
    ratedByUserRole: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound index to ensure a user can only rate an agent once
agentRatingSchema.index({ agentUserId: 1, ratedByUserId: 1 }, { unique: true });

// Index for efficiently querying ratings for an agent
agentRatingSchema.index({ agentUserId: 1, createdAt: -1 });

// Index for efficiently querying ratings by a user
agentRatingSchema.index({ ratedByUserId: 1, createdAt: -1 });

export const AgentRating = model<IAgentRating>("AgentRating", agentRatingSchema);
