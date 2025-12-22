import { model, Schema } from "mongoose";
import { countryList } from "../../../shared/constant/country.constant";

export type TAgent = {
  companyName: string;
  phoneNumber: string;
  country: (typeof countryList)[number];
  nationality: string;
  socialMedia: string;
  website: string;
  fifaLicenseNumber: string;
  averageRating: number;
  totalRatings: number;
};
const agentEmpSchema = new Schema<TAgent>({
  companyName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    enum: countryList,
    required: true,
  },
  nationality: {
    type: String,
    required: true,
  },
  socialMedia: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  },
  fifaLicenseNumber: {
    type: String,
    required: true,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0,
  },
});

export const AgentEmp = model<TAgent>("AgentEmp", agentEmpSchema);
