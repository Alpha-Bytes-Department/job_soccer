import { model, Schema } from "mongoose";
import { countryList } from "../../../shared/constant/country.constant";

enum TPosition {
  HEAD_COACH = "Head Coach", //done
  ASSISTANT_COACH = "Assistant Coach",  
  GK_COACH = "GK Coach",  //done
  MENTAL_COACH = "Mental Coach", //done
  VIDEO_ANALYST_COACH = "Video Analyst Coach", //done 
  SPECIFIC_FORWARD_COACH = "Specific Forward Coach", 
  SPECIFIC_DEFENSIVE_COACH = "Specific Defensive Coach", 
  SPECIFIC_TECHNICAL_COACH = "Specific Technical Coach", 
  SCOUT = "Scout", //done
  TECHNICAL_DIRECTOR = "Technical Director", //done
  ACADEMY_DIRECTOR = "Academy Director",
  DIRECTOR_OF_COACHING = "Director of Coaching", //done
}

export type TOnFieldStaffCan = {
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  phoneNumber?: string;
  currentClub: string;
  availability: string;
  gender: "Male" | "Female"|"Other";
  boyOrGirl: "Boy" | "Girl";
  league: string;
  category?: string;
  country: (typeof countryList)[number];
  socialMedia: string;
  agent?: string;
  position: TPosition;
  videos: {
    videoType: string; // From VideoType enum
    url: string;
    duration: number; // in seconds
    title?: string;
    description?: string;
    uploadedAt?: Date;
  }[];
  AiVideoVideoScore?: number;
};
const onFieldStaffCanSchema = new Schema<TOnFieldStaffCan>(
  {
    dateOfBirth: { type: Date, required: true },
    placeOfBirth: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: false, trim: true },
    currentClub: { type: String, required: true, trim: true },
    availability: { type: String, required: false, trim: true },
    country: {
      type: String,
      enum: countryList,
      required: true,
    },
    gender: { type: String, enum: ["Male", "Female","Other"], required: true },
    boyOrGirl: { type: String, enum: ["Boy", "Girl"], required: true },
    socialMedia: { type: String, required: true, trim: true },
    agent: { type: String, required: false, trim: true },
    league: { type: String, required: true, trim: true },
     category: { type: String, required: false, trim: true },
    position: {
      type: String,
      enum: Object.values(TPosition),
      required: true,
    },
    videos: [
      {
        videoType: { type: String, required: true, trim: true },
        url: { type: String, required: true, trim: true },
        duration: { type: Number, required: true }, // in seconds
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    AiVideoVideoScore: { type: Number, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const OnFieldStaffCan = model<TOnFieldStaffCan>(
  "OnFieldStaffCan",
  onFieldStaffCanSchema
);
