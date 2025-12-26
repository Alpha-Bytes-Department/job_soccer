import {
  VideoType,
  TPosition,
  OfficeStaffPosition,
  IPositionVideoConfig,
} from "./video.constant";

// Video Requirements Configuration for each position
export const VIDEO_REQUIREMENTS: Record<string, IPositionVideoConfig> = {
  // ON FIELD STAFF
  [TPosition.HEAD_COACH]: {
    position: TPosition.HEAD_COACH,
    totalVideos: 4,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.TECHNICAL, required: true },
      { type: VideoType.TACTICAL, required: true },
      { type: VideoType.GAME_PRINCIPALS, required: true },
    ],
  },

  [TPosition.ASSISTANT_COACH]: {
    position: TPosition.ASSISTANT_COACH,
    totalVideos: 4,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.TECHNICAL, required: true },
      { type: VideoType.TACTICAL, required: true },
      { type: VideoType.GAME_PRINCIPALS, required: true },
    ],
  },

  [TPosition.GK_COACH]: {
    position: TPosition.GK_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: true },
    ],
  },

  [TPosition.MENTAL_COACH]: {
    position: TPosition.MENTAL_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: true },
    ],
  },

  [TPosition.VIDEO_ANALYST_COACH]: {
    position: TPosition.VIDEO_ANALYST_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: true },
    ],
  },

  [TPosition.SPECIFIC_OFFENSIVE_COACH]: {
    position: TPosition.SPECIFIC_OFFENSIVE_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.TRAINING_METHODOLOGY, required: true },
    ],
  },

  [TPosition.SPECIFIC_DEFENSIVE_COACH]: {
    position: TPosition.SPECIFIC_DEFENSIVE_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.TRAINING_METHODOLOGY, required: true },
    ],
  },

  [TPosition.SPECIFIC_TECHNICAL_COACH]: {
    position: TPosition.SPECIFIC_TECHNICAL_COACH,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.TRAINING_METHODOLOGY, required: true },
    ],
  },

  [TPosition.SCOUT]: {
    position: TPosition.SCOUT,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.SCOUTING_METHODOLOGY, required: true },
    ],
  },

  [TPosition.TECHNICAL_DIRECTOR]: {
    position: TPosition.TECHNICAL_DIRECTOR,
    totalVideos: 3,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.CLUB_PHILOSOPHY_METHODOLOGY, required: true },
      { type: VideoType.PLAYER_RECRUITMENT_METHODOLOGY, required: true },
    ],
  },

  [TPosition.ACADEMY_DIRECTOR]: {
    position: TPosition.ACADEMY_DIRECTOR,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.YOUTH_DEVELOPMENT_METHODOLOGY, required: true },
    ],
  },

  [TPosition.DIRECTOR_OF_COACHING]: {
    position: TPosition.DIRECTOR_OF_COACHING,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.COACHING_RECRUITMENT_METHODOLOGY, required: true },
    ],
  },

  // OFFICE STAFF (all have same structure)
  [OfficeStaffPosition.ADMINISTRATIVE_DIRECTOR]: {
    position: OfficeStaffPosition.ADMINISTRATIVE_DIRECTOR,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.COMMUNITY_MANAGER]: {
    position: OfficeStaffPosition.COMMUNITY_MANAGER,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.DATA_ANALYST]: {
    position: OfficeStaffPosition.DATA_ANALYST,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.DIGITAL_MARKETING]: {
    position: OfficeStaffPosition.DIGITAL_MARKETING,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.MEDICAL_STAFF]: {
    position: OfficeStaffPosition.MEDICAL_STAFF,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.PERFORMANCE_STAFF]: {
    position: OfficeStaffPosition.PERFORMANCE_STAFF,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.EQUIPMENT_STAFF]: {
    position: OfficeStaffPosition.EQUIPMENT_STAFF,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  [OfficeStaffPosition.SALES]: {
    position: OfficeStaffPosition.SALES,
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.PRE_RECORDED_INTERVIEW, required: true },
      { type: VideoType.METHODOLOGY, required: false }, // Optional
    ],
  },

  // PLAYERS (Professional & Amateur)
  "Professional Player": {
    position: "Professional Player",
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.HIGHLIGHTS, required: true },
      { type: VideoType.HIGHLIGHTS, required: true },
    ],
    forbiddenVideoTypes: [VideoType.PRE_RECORDED_INTERVIEW], // Players don't need interview
  },

  "Amateur Player": {
    position: "Amateur Player",
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.HIGHLIGHTS, required: true },
      { type: VideoType.HIGHLIGHTS, required: true },
    ],
    forbiddenVideoTypes: [VideoType.PRE_RECORDED_INTERVIEW], // Players don't need interview
  },

  // HIGH SCHOOL Player & COLLEGE/UNIVERSITY Player (Student Players)
  "High School Player": {
    position: "High School Player",
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.HIGHLIGHTS, required: true },
      { type: VideoType.HIGHLIGHTS, required: true },
    ],
    forbiddenVideoTypes: [VideoType.PRE_RECORDED_INTERVIEW], // Players don't need interview
  },

  "College/University Player": {
    position: "College/University Player",
    totalVideos: 2,
    maxDuration: 180,
    requiredVideoTypes: [
      { type: VideoType.HIGHLIGHTS, required: true },
      { type: VideoType.HIGHLIGHTS, required: true },
    ],
    forbiddenVideoTypes: [VideoType.PRE_RECORDED_INTERVIEW], // Players don't need interview
  },
};

// Helper function to get video requirements by position
export const getVideoRequirements = (
  position: string
): IPositionVideoConfig => {
  const requirements = VIDEO_REQUIREMENTS[position];

  if (!requirements) {
    throw new Error(`No video requirements found for position: ${position}`);
  }

  return requirements;
};

// Helper to check if position is office staff
export const isOfficeStaff = (position: string): boolean => {
  return Object.values(OfficeStaffPosition).includes(
    position as OfficeStaffPosition
  );
};

// Helper to check if position is player
export const isPlayer = (position: string): boolean => {
  return (
    position === "Professional Player" ||
    position === "Amateur Player" ||
    position === "High School Player" ||
    position === "College/University Player"
  );
};

// Helper to validate office staff video count (1 or 2 videos allowed due to optional methodology)
export const validateOfficeStaffVideoCount = (videoCount: number): boolean => {
  return videoCount === 1 || videoCount === 2;
};

// Helper to validate player video count (exactly 2 highlights required)
export const validatePlayerVideoCount = (videoCount: number): boolean => {
  return videoCount === 2;
};
