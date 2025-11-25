import { model, Schema } from "mongoose";
import { TCandidateExperience } from "./candidateExperience.interface";

const candidateExperienceSchema = new Schema<TCandidateExperience>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      ref: "User",
    },
    profileId: {
      type: String,
      required: true,
      index: true,
    },
    candidateRole: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["FullTime", "PartTime", "Contract"],
      required: true,
    },
    club: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    isCurrentlyWorking: {
      type: Boolean,
      required: true,
      default: false,
    },
    startMonth: {
      type: String,
      required: true,
    },
    startYear: {
      type: Number,
      required: true,
    },
    endMonth: {
      type: String,
      required: false,
    },
    endYear: {
      type: Number,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, versionKey: false }
);

// Index for efficiently finding user's experience records
candidateExperienceSchema.index({ userId: 1, createdAt: -1 });
// Index for finding experience by profile
candidateExperienceSchema.index({ profileId: 1, startYear: -1 });
// Index for currently working positions
candidateExperienceSchema.index({ userId: 1, isCurrentlyWorking: 1 });

export const CandidateExperience = model<TCandidateExperience>(
  "CandidateExperience",
  candidateExperienceSchema
);
