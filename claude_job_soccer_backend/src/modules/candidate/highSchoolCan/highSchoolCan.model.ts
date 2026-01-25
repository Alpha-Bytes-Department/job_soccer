import { model, Schema } from "mongoose";
import { countryList } from "../../../shared/constant/country.constant";

enum TPosition {
  GK = "GK",
  CENTRAL_BACK = "Central back",
  LEFT_BACK = "Left back",
  RIGHT_BACK = "Right back",
  DEFENSIVE_MIDFIELDER = "Defensive midfielder",
  OFFENSIVE_MIDFIELDER = "Offensive midfielder",
  RIGHT_WINGER = "Right winger",
  LEFT_WINGER = "Left winger",
  FORWARD = "Forward",
  STRIKER = "Striker",
}
enum TAvailability {
  NOW = "Now",
  SOON = "Soon",
  LATER = "Later",
}

enum TFoot {
  RIGHT = "Right",
  LEFT = "Left",
  BOTH = "Both",
}

export type THighSchoolCan = {
  dateOfBirth: Date;
  placeOfBirth: string;
  nationality: string;
  phoneNumber?: string;
  gender: string;
  height: { size: number; unit: string };
  currentClub: string;
  category?: string;
  position: TPosition; 
  agent?: string;
  satOrAct?: string;
  availability: TAvailability;
  weight: { size: number; unit: string };
  socialMedia: string;
  foot: TFoot;
  league: string;
  schoolName: string;
  gpa: string;
  country: (typeof countryList)[number];
  videos: {
    url: string;
    duration: number; // in seconds
    title: string;
    uploadedAt?: Date;
  }[];
};

const highSchoolCanSchema = new Schema<THighSchoolCan>(
  {
    dateOfBirth: { type: Date, required: true },
    placeOfBirth: { type: String, required: true, trim: true },
    nationality: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: false, trim: true },
    gender: { type: String, required: true, trim: true },
    height: {
      size: { type: Number, required: true },
      unit: { type: String, required: true, enum: ["cm", "m", "in", "ft"] },
    },
    currentClub: { type: String, required: true, trim: true },
    category: { type: String, required: false, trim: true },
    position: {
      type: String,
      enum: Object.values(TPosition),
      required: true,
    },
    agent: { type: String, required: false, trim: true },
    satOrAct: { type: String, required: false, trim: true },
    availability: {
      type: String,
      enum: Object.values(TAvailability),
      required: false,
    },
    weight: {
      size: { type: Number, required: true },
      unit: { type: String, required: true, enum: ["kg", "lb"] },
    },
    socialMedia: { type: String, required: true, trim: true },
    foot: {
      type: String,
      enum: Object.values(TFoot),
      required: true,
    },
    league: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },
    gpa: { type: String, required: false, trim: true },
    country: {
      type: String,
      enum: countryList,
      required: true,
    },
    videos: [
      {
        url: { type: String, required: true, trim: true },
        duration: { type: Number, required: true }, // in seconds
        title: { type: String, required: true, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const HighSchoolCan = model<THighSchoolCan>(
  "HighSchoolCan",
  highSchoolCanSchema
);
