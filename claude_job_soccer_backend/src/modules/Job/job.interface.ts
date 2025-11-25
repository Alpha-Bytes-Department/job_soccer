import { Types } from "mongoose";
import { CandidateRole, EmployerRole } from "../user/user.interface";

export type ContractType = "FullTime" | "PartTime"| "Contract";
export type JobStatus = "active" | "closed" | "draft" | "expired";
export type ExperienceLevel = "Entry Level" | "Intermediate" | "Mid-Level" | "Mid-Senior" | "Senior";

export enum ExperienceLevelEnum {
  ENTRY_LEVEL = "Entry Level",
  INTERMEDIATE = "Intermediate",
  MID_LEVEL = "Mid-Level",
  MID_SENIOR = "Mid-Senior",
  SENIOR = "Senior",
}

export interface IJob {
  jobTitle: string;
  creator: {
    creatorId: Types.ObjectId;
    creatorRole: EmployerRole;
  };
  location: string;
  deadline: Date;
  jobOverview: string;
  jobCategory: CandidateRole;
  position: string;
  contractType: ContractType;
  status: JobStatus;
  salary: {
    min: number;
    max: number;
  };
  requiredAiScore?: number;
  experience: ExperienceLevel;
  requirements: string;
  responsibilities: string;
  requiredSkills: string;
  additionalRequirements?: string;

  country?: string;
  searchKeywords?: string[];
  applicationCount?: number;
  // Timestamps for sorting and filtering
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date; // Auto-set from deadline for easier querying
}
