import { Types } from "mongoose";

export enum VerificationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export type TAdminVerification = {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  userType: "candidate" | "employer";
  status: VerificationStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};
