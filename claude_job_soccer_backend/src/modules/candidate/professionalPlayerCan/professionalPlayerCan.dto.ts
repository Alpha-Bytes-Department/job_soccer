import { z } from "zod";

const createProfessionalPlayerCanDto = z.object({
  dateOfBirth: z
    .string()
    .refine(
      (date) => {
        const parsedDate = new Date(date);
        return !isNaN(parsedDate.getTime()) && parsedDate < new Date();
      },
      {
        message: "Date of birth must be a valid date in the past",
      }
    )
    .transform((date) => new Date(date)),
  placeOfBirth: z.string().trim().min(1, "Place of birth is required"),
  nationality: z.string().trim().min(1, "Nationality is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required").optional(),
  gender: z.string().trim().min(1, "Gender is required"),
  height: z.object({
    size: z.number().positive("Height must be positive"),
    unit: z.enum(["cm", "m", "in", "ft"]),
  }),
  nationalTeamCategory: z.enum([
    "U14",
    "U15",
    "U16",
    "U17",
    "U18",
    "U19",
    "U20",
    "U21",
    "Current International",
  ]).optional(),
  currentClub: z.string().trim().min(1, "Current club is required"),
  division: z.string().trim().min(1, "Division is required"),
  position: z.enum([
    "GK",
    "Central back",
    "Left back",
    "Right back",
    "Defensive midfielder",
    "Offensive midfielder",
    "Right winger",
    "Left winger",
    "Forward",
    "Striker",
  ]),
  agent: z.string().trim().min(1, "Agent is required").optional(),
  country: z.string().min(1, "Country is required"),
  availability: z.enum(["Now", "Soon", "Later"]).optional(),
  weight: z.object({
    size: z.number().positive("Weight must be positive"),
    unit: z.enum(["kg", "lb"]),
  }),
  nationalTeamGames: z
    .string()
    .trim()
    .min(1, "National team games is required"),
  socialMedia: z.string().trim().min(1, "Social media is required"),
  foot: z.enum(["Right", "Left", "Both"]),
  teamsJoined: z.string().trim().min(1, "Teams joined is required"),
  contractExpires: z.string().trim().min(1, "Contract expires is required"),
  // Videos will be handled separately through file upload (2 Highlights videos required)
  videos: z
    .array(
      z.object({
        url: z.string().min(1, "Video URL is required"),
        duration: z.number().min(0, "Duration must be non-negative"), // Duration validation handled by frontend
        title: z.string().min(1, "Video title is required"),
        uploadedAt: z.date().optional(),
      })
    )
    .optional(),
});

const updateProfessionalPlayerCanDto = createProfessionalPlayerCanDto.partial();

export type TCreateProfessionalPlayerCanDto = z.infer<
  typeof createProfessionalPlayerCanDto
>;
export type TUpdateProfessionalPlayerCanDto = z.infer<
  typeof updateProfessionalPlayerCanDto
>;

export const ProfessionalPlayerCanDto = {
  createProfessionalPlayerCanDto,
  updateProfessionalPlayerCanDto,
};
