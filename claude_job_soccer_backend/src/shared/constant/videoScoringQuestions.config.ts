import { CandidateRole } from "../../modules/user/user.interface";

/**
 * Video Scoring Questions Configuration
 *
 * Defines evaluation criteria for AI video scoring.
 * - OFFICE_STAFF: Single question set for all positions
 * - ON_FIELD_STAFF: Position-specific question sets (to be added)
 */

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface IScoringQuestion {
  id: number;
  text: string;
}

export interface IScoringCategory {
  name: string;
  objective: string;
  maxScore: number;
  questions: IScoringQuestion[];
}

export interface IVideoScoringQuestionSet {
  role: string;
  position?: string; // undefined means "all positions" for this role
  totalScore: number;
  categories: IScoringCategory[];
}

// ─── Office Staff Questions (Single set for ALL positions) ───────────────────

const OFFICE_STAFF_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.OFFICE_STAFF,
  totalScore: 100,
  categories: [
    {
      name: "Communication",
      objective:
        "Evaluate clarity, coordination, and professional interaction.",
      maxScore: 13,
      questions: [
        {
          id: 1,
          text: "How do you ensure clear and effective communication between technical staff, management, and external partners?",
        },
        {
          id: 2,
          text: "How do you adapt your communication style depending on your audience (coaches, executives, parents, partners)?",
        },
      ],
    },
    {
      name: "Leadership & Responsibility",
      objective: "Assess ownership, decision-making, and accountability.",
      maxScore: 13,
      questions: [
        {
          id: 3,
          text: "Describe a situation where you had to take responsibility for a decision or outcome.",
        },
        {
          id: 4,
          text: "How do you manage priorities when working with multiple departments or stakeholders at the same time?",
        },
      ],
    },
    {
      name: "Adaptability & Problem Solving",
      objective:
        "Measure flexibility, resilience, and operational thinking.",
      maxScore: 12,
      questions: [
        {
          id: 5,
          text: "Describe a time when you had to adapt quickly to an unexpected change in your work environment.",
        },
        {
          id: 6,
          text: "How do you handle pressure during critical periods such as deadlines, events, or competitions?",
        },
      ],
    },
    {
      name: "Methodology & Work Process",
      objective: "Understand structure, organization, and consistency.",
      maxScore: 23,
      questions: [
        {
          id: 7,
          text: "How do you structure your work processes to ensure efficiency and consistency?",
        },
        {
          id: 8,
          text: "What tools or methods do you use to plan, track, and evaluate your work?",
        },
      ],
    },
    {
      name: "Professionalism & Ethics",
      objective: "Assess integrity, reliability, and standards.",
      maxScore: 12,
      questions: [
        {
          id: 10,
          text: "How do you handle confidential or sensitive information within a football organization?",
        },
        {
          id: 11,
          text: "What professional standards and ethical principles guide your daily work?",
        },
      ],
    },
    {
      name: "Motivation & Career Mindset",
      objective:
        "Understand commitment and long-term alignment with football.",
      maxScore: 10,
      questions: [
        {
          id: 12,
          text: "What motivates you to work in football beyond the position itself?",
        },
        {
          id: 13,
          text: "How do you continue to develop your professional skills and knowledge?",
        },
      ],
    },
    {
      name: "Collaboration & Organizational Impact",
      objective:
        "Evaluate teamwork and contribution to the organization.",
      maxScore: 17,
      questions: [
        {
          id: 14,
          text: "How do you collaborate with other departments to support the club or organization's objectives?",
        },
        {
          id: 15,
          text: "In what ways do you believe your role contributes to the overall performance of the organization?",
        },
      ],
    },
  ],
};

// ─── On Field Staff Questions (Per-position, to be added) ────────────────────

// Placeholder map: position -> question set
// Will be populated when ON_FIELD_STAFF questions are provided
const ON_FIELD_STAFF_QUESTIONS: Map<string, IVideoScoringQuestionSet> =
  new Map();

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the video scoring question set for a given role and position.
 *
 * - OFFICE_STAFF: Returns the single shared question set (position ignored)
 * - ON_FIELD_STAFF: Returns the position-specific question set
 *
 * @returns The question set, or null if not configured
 */
export function getVideoScoringQuestions(
  role: CandidateRole,
  position?: string
): IVideoScoringQuestionSet | null {
  if (role === CandidateRole.OFFICE_STAFF) {
    return OFFICE_STAFF_QUESTIONS;
  }

  if (role === CandidateRole.ON_FIELD_STAFF && position) {
    return ON_FIELD_STAFF_QUESTIONS.get(position) || null;
  }

  return null;
}

/**
 * Register an On Field Staff position question set.
 * Used to add position-specific questions dynamically or at module load.
 */
export function registerOnFieldStaffQuestions(
  position: string,
  questionSet: IVideoScoringQuestionSet
): void {
  ON_FIELD_STAFF_QUESTIONS.set(position, questionSet);
}

/**
 * Check if video scoring is available for a given role/position.
 */
export function hasVideoScoringQuestions(
  role: CandidateRole,
  position?: string
): boolean {
  return getVideoScoringQuestions(role, position) !== null;
}
