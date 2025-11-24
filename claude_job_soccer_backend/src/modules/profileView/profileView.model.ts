import { model, Schema } from "mongoose";
import { IProfileView } from "./profileView.interface";

const profileViewSchema = new Schema<IProfileView>(
  {
    viewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    viewerType: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
    },
    viewerRole: {
      type: String,
      required: true,
      index: true,
    },
    profileOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    profileOwnerType: {
      type: String,
      enum: ["candidate", "employer"],
      required: true,
    },
    profileOwnerRole: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Compound index for efficient queries by profile owner and date
profileViewSchema.index({ profileOwnerId: 1, createdAt: -1 });

// Index for querying views by viewer
profileViewSchema.index({ viewerId: 1, createdAt: -1 });

// Index for date range queries
profileViewSchema.index({ createdAt: -1 });

// Index for checking if a viewer already viewed a profile recently (optional for deduplication)
profileViewSchema.index({ viewerId: 1, profileOwnerId: 1, createdAt: -1 });

export const ProfileView = model<IProfileView>("ProfileView", profileViewSchema);
