import { Types } from "mongoose";

export interface IProfileView {
  viewerId: Types.ObjectId; // User who viewed the profile
  viewerType: "candidate" | "employer";
  viewerRole: string;
  profileOwnerId: Types.ObjectId; // User whose profile was viewed
  profileOwnerType: "candidate" | "employer";
  profileOwnerRole: string;
  createdAt: Date;
  updatedAt: Date;
}
