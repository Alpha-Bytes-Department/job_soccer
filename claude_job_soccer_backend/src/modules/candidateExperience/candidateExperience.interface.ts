import { Types } from "mongoose";
import { TMonth } from "../../shared/constant/month.constant";

export type TCandidateExperience = {
  _id?: Types.ObjectId;
  userId: string; // User._id from User collection
  profileId: string; // The actual candidate profile ID
  candidateRole: string;
  title: string;
  employmentType: "FullTime" | "PartTime" | "Contract";
  club: string;
  location: string;
  isCurrentlyWorking: boolean;
  startMonth: TMonth;
  startYear: number;
  endMonth?: TMonth;
  endYear?: number;
  description?: string;
};
