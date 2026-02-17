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

// ─── On Field Staff Questions (Per-position) ─────────────────────────────────
//
// Universal Evaluation Structure (all ON_FIELD_STAFF positions):
//   6 categories × 3 questions = 18 questions per position
//   Weights: 20 + 20 + 20 + 15 + 15 + 10 = 100 points
//   Category names are position-specific; weights are universal.
//
// Universal Scoring Rubric (0–5 per question, scaled to category weight):
//   0 = No evidence (no answer or irrelevant)
//   1 = Very weak (vague or theoretical)
//   2 = Weak (limited practical experience)
//   3 = Acceptable (clear with relevant examples)
//   4 = Strong (structured with applied impact)
//   5 = Elite (high-level, consistent, scalable coaching performance)
//
// Score Interpretation:
//   < 60  → Risk — Not ready for competitive level
//   60–74 → Operational — Requires supervision
//   75–84 → Strong — Reliable coach
//   ≥ 85  → Elite — High-impact performance coach
// ──────────────────────────────────────────────────────────────────────────────

const ON_FIELD_STAFF_QUESTIONS: Map<string, IVideoScoringQuestionSet> =
  new Map();

// ─── Technical Director ──────────────────────────────────────────────────────

const TECHNICAL_DIRECTOR_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Technical Director",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess professional pathway, role clarity, and ability to balance strategic vision with operational demands.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your professional background and pathway to becoming a Technical Director?",
        },
        {
          id: 2,
          text: "How do you define the role and responsibilities of a Technical Director within a football club?",
        },
        {
          id: 3,
          text: "How do you balance strategic vision with day-to-day operational demands?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate tactical evaluation ability, coaching oversight, and data-driven decision making.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you evaluate tactical consistency across all teams within the club?",
        },
        {
          id: 5,
          text: "How do you assess whether coaches are implementing the playing philosophy correctly?",
        },
        {
          id: 6,
          text: "How do you analyze team and player performance data to guide technical decisions?",
        },
      ],
    },
    {
      name: "Technical Project & Methodology",
      objective:
        "Understand project structure, development-performance alignment, and implementation oversight.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure and oversee the club's technical project throughout a season?",
        },
        {
          id: 8,
          text: "What methodology do you use to align player development with team performance objectives?",
        },
        {
          id: 9,
          text: "How do you evaluate whether the technical project is being correctly implemented?",
        },
      ],
    },
    {
      name: "Playing Model & Communication",
      objective:
        "Assess playing model definition, vision communication, and handling of complex technical decisions.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you define the club's playing model and game principles across all teams and age groups?",
        },
        {
          id: 11,
          text: "How do you communicate the technical vision and expectations to coaches and staff?",
        },
        {
          id: 12,
          text: "Describe a situation where you had to communicate a complex or sensitive technical decision.",
        },
      ],
    },
    {
      name: "Leadership, Collaboration & Adaptability",
      objective:
        "Evaluate cross-department collaboration, leadership influence, and contextual adaptability.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with the head coach, academy staff, and management to align objectives?",
        },
        {
          id: 14,
          text: "Describe a moment when your technical leadership influenced an important sporting decision.",
        },
        {
          id: 15,
          text: "Describe a situation where the technical project needed adjustment due to results or context.",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Vision",
      objective:
        "Measure impact evaluation beyond results, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "How do you measure the effectiveness and impact of the technical project beyond match results?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as a Technical Director?",
        },
        {
          id: 18,
          text: "How has your technical leadership and methodology evolved over the past three to five years?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Technical Director", TECHNICAL_DIRECTOR_QUESTIONS);

// ─── Mental Coach ────────────────────────────────────────────────────────────

const MENTAL_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Mental Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess training background in mental performance/sport psychology, soccer-specific experience, and role clarity.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your background and training in mental performance or sport psychology?",
        },
        {
          id: 2,
          text: "What is your experience working with soccer players or team staff specifically?",
        },
        {
          id: 3,
          text: "How do you define the role of a mental coach within a soccer environment?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise Integration",
      objective:
        "Evaluate ability to connect mental preparation with tactical performance, psychological behavior analysis, and mental discipline.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you connect mental preparation with tactical performance and decision-making?",
        },
        {
          id: 5,
          text: "How do you analyze psychological behaviors that influence match performance?",
        },
        {
          id: 6,
          text: "How do you help players maintain mental discipline within tactical structures?",
        },
      ],
    },
    {
      name: "Methodology & Approach",
      objective:
        "Understand general methodology (individual vs collective), mental profiling, and prioritization of mental skills.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "What is your general methodology when working with players (individual vs collective)?",
        },
        {
          id: 8,
          text: "How do you assess a player's mental profile at the start of your work?",
        },
        {
          id: 9,
          text: "Which mental skills do you prioritize most in soccer and why?",
        },
      ],
    },
    {
      name: "Application in Soccer Context",
      objective:
        "Assess adaptability across age groups, pressure/anxiety management, and match-specific mental preparation.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you adapt your work according to age groups (youth, academy, senior players)?",
        },
        {
          id: 11,
          text: "How do you handle pressure-related issues such as competition stress, selection anxiety, or fear of failure?",
        },
        {
          id: 12,
          text: "Can you give an example of how you prepare a player mentally for an important match or trial?",
        },
      ],
    },
    {
      name: "Collaboration & Integration",
      objective:
        "Evaluate staff collaboration, alignment with game model, and professional boundary awareness.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with coaches, technical staff, and medical staff?",
        },
        {
          id: 14,
          text: "How do you ensure your mental coaching aligns with the team's game model and performance objectives?",
        },
        {
          id: 15,
          text: "What boundaries do you set between mental coaching and clinical psychology?",
        },
      ],
    },
    {
      name: "Evaluation & Impact",
      objective:
        "Measure effectiveness tracking, demonstrated impact on performance, and adaptability with resistant players.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "How do you measure the effectiveness of your mental coaching work?",
        },
        {
          id: 17,
          text: "Can you share an example of a situation where your intervention had a clear impact on performance or behavior?",
        },
        {
          id: 18,
          text: "How do you adapt your approach when a player is resistant or not fully engaged?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Mental Coach", MENTAL_COACH_QUESTIONS);

// ─── Video Analyst Coach ─────────────────────────────────────────────────────

const VIDEO_ANALYST_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Video Analyst Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess professional pathway, role clarity within technical staff, and alignment with head coach objectives.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your background and pathway to becoming a video analyst in football?",
        },
        {
          id: 2,
          text: "How do you define your role and responsibilities within a technical staff?",
        },
        {
          id: 3,
          text: "How do you ensure your analysis supports the head coach's tactical objectives?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to identify tactical patterns, assess player decision-making, and analyze opposition.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you identify tactical patterns and trends from match footage?",
        },
        {
          id: 5,
          text: "How do you evaluate player decision-making using video analysis?",
        },
        {
          id: 6,
          text: "How do you assess opposition strengths and weaknesses through analysis?",
        },
      ],
    },
    {
      name: "Analysis Methodology & Workflow",
      objective:
        "Understand weekly workflow structure, clip/data prioritization, and tools or software proficiency.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure your video analysis workflow throughout a week?",
        },
        {
          id: 8,
          text: "How do you select and prioritize key clips or data points for analysis?",
        },
        {
          id: 9,
          text: "What tools or software do you use to support your analysis process?",
        },
      ],
    },
    {
      name: "Tactical Model & Communication",
      objective:
        "Assess playing model analysis, translation of insights into actionable coaching points, and communication of complex findings.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you analyze a team's playing model and game principles?",
        },
        {
          id: 11,
          text: "How do you translate tactical analysis into actionable insights for coaches and players?",
        },
        {
          id: 12,
          text: "Describe a situation where you had to communicate a complex or sensitive analysis message.",
        },
      ],
    },
    {
      name: "Collaboration & Adaptability",
      objective:
        "Evaluate staff collaboration, influence on tactical decisions, and ability to adjust analysis approach.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with coaches and staff to align analysis with training and matches?",
        },
        {
          id: 14,
          text: "Describe a moment when your analysis influenced an important tactical decision.",
        },
        {
          id: 15,
          text: "Describe a match where your initial analysis approach was not sufficient. What adjustments did you make?",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Development",
      objective:
        "Measure self-awareness of strengths/weaknesses, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What do you consider to be your main strengths as a video analyst, and which areas are you improving?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced in this role, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure the impact of your analysis beyond results, and how has your methodology evolved?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Video Analyst Coach", VIDEO_ANALYST_COACH_QUESTIONS);

// ─── Director of Coaching ────────────────────────────────────────────────────

const DIRECTOR_OF_COACHING_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Director of Coaching",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess professional pathway, coaching philosophy evolution, and role clarity within a club or organization.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your professional background and pathway to becoming a Director of Coaching?",
        },
        {
          id: 2,
          text: "What is your coaching philosophy, and how has it evolved over time?",
        },
        {
          id: 3,
          text: "How do you define the role and responsibilities of a Director of Coaching within a club or organization?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate tactical consistency oversight, coaching standards implementation, and data-driven decision making.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you evaluate tactical consistency across teams within the club?",
        },
        {
          id: 5,
          text: "How do you ensure technical and tactical standards are implemented by coaches?",
        },
        {
          id: 6,
          text: "How do you analyze player and team performance data to guide coaching decisions?",
        },
      ],
    },
    {
      name: "Club Philosophy & Methodology",
      objective:
        "Understand unified playing philosophy design, methodology principles, and balancing consistency with coach autonomy.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you design and implement a unified playing philosophy across all age groups?",
        },
        {
          id: 8,
          text: "What principles guide your coaching methodology in training and competition?",
        },
        {
          id: 9,
          text: "How do you ensure consistency while allowing coaches autonomy at different levels?",
        },
      ],
    },
    {
      name: "Coach Development & Management",
      objective:
        "Assess coach recruitment, development and evaluation processes, performance indicators, and licensing pathway support.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you recruit, develop, and evaluate coaches within the organization?",
        },
        {
          id: 11,
          text: "What tools or indicators do you use to assess coaching performance?",
        },
        {
          id: 12,
          text: "How do you support coaches in their professional development and licensing pathway?",
        },
      ],
    },
    {
      name: "Player Development Framework",
      objective:
        "Evaluate alignment of development with performance outcomes, multi-domain integration, and age-group transition management.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you align player development objectives with long-term performance outcomes?",
        },
        {
          id: 14,
          text: "How do you integrate physical, technical, tactical, and mental development into a single framework?",
        },
        {
          id: 15,
          text: "How do you manage transitions between age groups and competitive levels?",
        },
      ],
    },
    {
      name: "Leadership, Structure & Evaluation",
      objective:
        "Measure cross-department collaboration, program success measurement, and strategic prioritization ability.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "How do you collaborate with technical directors, performance staff, and management?",
        },
        {
          id: 17,
          text: "How do you measure the success of the coaching program at both individual and collective levels?",
        },
        {
          id: 18,
          text: "If you were appointed today, what would be your priorities in the first 90 days?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Director of Coaching", DIRECTOR_OF_COACHING_QUESTIONS);

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
