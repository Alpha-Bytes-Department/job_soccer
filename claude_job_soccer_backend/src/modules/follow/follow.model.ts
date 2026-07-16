import { model, Schema } from "mongoose";
import { TFollow } from "./follow.interface";

const followSchema = new Schema<TFollow>(
  {
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followerType: {
      type: String,
      required: true,
    },
    followerRole: {
      type: String,
      required: true,
      index: true,
    },
    followingId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    followingRole: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound index to ensure a user can only follow another user once
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Index for efficiently querying followers of a user
followSchema.index({ followingId: 1, createdAt: -1 });

// Index for efficiently querying who a user is following
followSchema.index({ followerId: 1, createdAt: -1 });

export const Follow = model<TFollow>("Follow", followSchema);
