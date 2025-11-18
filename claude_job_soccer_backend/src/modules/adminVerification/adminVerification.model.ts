import { model, Schema } from "mongoose";
import { TAdminVerification, VerificationStatus } from "./adminVerification.interface";

const adminVerificationSchema = new Schema<TAdminVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["candidate", "employer"],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
      index: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for filtering
adminVerificationSchema.index({ status: 1, userType: 1, createdAt: -1 });

// Ensure only one verification request per user
adminVerificationSchema.index({ userId: 1 }, { unique: true });

export const AdminVerification = model<TAdminVerification>(
  "AdminVerification",
  adminVerificationSchema
);
