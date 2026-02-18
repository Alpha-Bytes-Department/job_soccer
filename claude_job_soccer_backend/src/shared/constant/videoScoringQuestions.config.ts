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

// ─── GK Coach ────────────────────────────────────────────────────────────────

const GK_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "GK Coach",
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
          text: "Can you describe your background and pathway to becoming a goalkeeper coach?",
        },
        {
          id: 2,
          text: "How do you define the role and responsibilities of a goalkeeper coach within a technical staff?",
        },
        {
          id: 3,
          text: "How do you align your work with the head coach and overall team objectives?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to analyze goalkeeper decision-making, positioning/tactical awareness, and contribution to team tactical organization.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you analyze goalkeeper decision-making during matches?",
        },
        {
          id: 5,
          text: "How do you assess positioning and tactical awareness of a goalkeeper?",
        },
        {
          id: 6,
          text: "How do you evaluate a goalkeeper's contribution to team tactical organization?",
        },
      ],
    },
    {
      name: "Coaching Methodology & Training Design",
      objective:
        "Understand weekly session structure, individualization by profile/age/level, and progression assessment tools.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure your goalkeeper training sessions throughout a week to reflect your methodology?",
        },
        {
          id: 8,
          text: "How do you individualize training based on goalkeeper profiles, age, and level?",
        },
        {
          id: 9,
          text: "What tools or indicators do you use to assess goalkeeper progression?",
        },
      ],
    },
    {
      name: "Game Principles & Communication",
      objective:
        "Assess game principles integration into playing model, concept explanation clarity, and difficult communication handling.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "What are your key game principles for goalkeepers, and how do they integrate into the team's playing model?",
        },
        {
          id: 11,
          text: "How do you explain technical and tactical concepts to ensure goalkeeper understanding and execution?",
        },
        {
          id: 12,
          text: "Describe a situation where you had to communicate a difficult message to a goalkeeper.",
        },
      ],
    },
    {
      name: "Leadership, Collaboration & Adaptability",
      objective:
        "Evaluate authority and trust building, handling unpopular decisions, and in-match adaptability.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you establish authority and trust as a goalkeeper coach within the staff and squad?",
        },
        {
          id: 14,
          text: "Describe a moment when you had to make an unpopular decision regarding goalkeeper selection or focus.",
        },
        {
          id: 15,
          text: "Describe a match where your goalkeeper preparation did not work as expected. What adjustments did you make?",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Vision",
      objective:
        "Measure self-awareness of strengths/weaknesses, professional resilience, and success measurement beyond clean sheets.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What do you consider to be your main strengths as a goalkeeper coach, and which areas are you improving?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced in this role, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure success as a goalkeeper coach beyond clean sheets, and how has your approach evolved?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("GK Coach", GK_COACH_QUESTIONS);

// ─── Head Coach ──────────────────────────────────────────────────────────────

const HEAD_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Head Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess coaching pathway, philosophy evolution, and understanding of head coach responsibilities.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your coaching background and pathway to your current level?",
        },
        {
          id: 2,
          text: "How would you describe your coaching philosophy, and how has it evolved over time?",
        },
        {
          id: 3,
          text: "What do you see as your main responsibilities as a head coach within a club or organization?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate tactical performance analysis, player understanding of game principles, and use of match data/video.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you evaluate team tactical performance during matches?",
        },
        {
          id: 5,
          text: "How do you assess whether players understand and apply your game principles?",
        },
        {
          id: 6,
          text: "How do you analyze match data or video to improve team performance?",
        },
      ],
    },
    {
      name: "Methodology, Training & Playing Model",
      objective:
        "Understand session structure and weekly planning, game principle consistency, and tactical concept teaching ability.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure your training sessions and weekly planning to reflect your coaching methodology?",
        },
        {
          id: 8,
          text: "What are your main game principles, and how do you ensure they are applied consistently during matches?",
        },
        {
          id: 9,
          text: "When you introduce a new tactical concept, how do you teach it so all players understand and can execute it?",
        },
      ],
    },
    {
      name: "Leadership & Communication",
      objective:
        "Assess authority establishment, handling of unpopular decisions, and difficult communication approaches.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you establish your authority and leadership within a new team?",
        },
        {
          id: 11,
          text: "Describe a moment when you had to make an unpopular decision. How did you handle it?",
        },
        {
          id: 12,
          text: "Describe a situation where you had to communicate a difficult decision to your team. What was your approach?",
        },
      ],
    },
    {
      name: "Adaptability & Problem Solving",
      objective:
        "Evaluate in-match adaptability, resource-constrained coaching, and approach adjustment across age groups/levels.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "Describe a match where your original game plan did not work. What did you change and why?",
        },
        {
          id: 14,
          text: "Tell us about a time when you had to coach with limited resources (time, staff, facilities, injuries). How did you manage it?",
        },
        {
          id: 15,
          text: "How do you adjust your coaching approach to different age groups and competitive levels?",
        },
      ],
    },
    {
      name: "Professionalism, Staff Building & Evaluation",
      objective:
        "Measure self-awareness of strengths/improvement areas, professional resilience, and staff selection process.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What do you consider to be your main strengths as a coach, and which areas are you actively working to improve?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as a coach, and how did you overcome it?",
        },
        {
          id: 18,
          text: "What is your process for selecting and building your coaching staff?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Head Coach", HEAD_COACH_QUESTIONS);

// ─── Scout ───────────────────────────────────────────────────────────────────

const SCOUT_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Scout",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess scouting pathway, role clarity within recruitment/technical department, and alignment with club strategy.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your scouting background and pathway to becoming a scout?",
        },
        {
          id: 2,
          text: "What is your primary role and responsibility within a recruitment or technical department?",
        },
        {
          id: 3,
          text: "How do you align your scouting priorities with club strategy and recruitment needs?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to assess tactical intelligence, decision-making quality, and tactical fit with a playing model.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you evaluate a player's tactical intelligence during matches?",
        },
        {
          id: 5,
          text: "How do you assess decision-making quality in game situations?",
        },
        {
          id: 6,
          text: "How do you identify tactical fit between a player and a team's playing model?",
        },
      ],
    },
    {
      name: "Scouting Methodology",
      objective:
        "Understand player evaluation criteria, end-to-end scouting process, and use of data analytics/video analysis.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "What key attributes do you look for when evaluating a player's potential?",
        },
        {
          id: 8,
          text: "Can you walk us through your scouting process from identifying a player to making a recommendation?",
        },
        {
          id: 9,
          text: "Do you have experience using data analytics or video analysis to support your scouting decisions?",
        },
      ],
    },
    {
      name: "Player Profile & Game Understanding",
      objective:
        "Assess development potential evaluation, multi-domain profile analysis, and performance contextualization.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you evaluate a player's potential for development and readiness to move to the next level?",
        },
        {
          id: 11,
          text: "How do you analyze a player's profile (technical, tactical, physical, mental) in relation to a team's playing model?",
        },
        {
          id: 12,
          text: "How do you contextualize individual performance based on competition level, age, and role?",
        },
      ],
    },
    {
      name: "Communication, Collaboration & Adaptability",
      objective:
        "Evaluate report presentation clarity, handling of complex scouting opinions, and alignment with coaches and staff.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you present your scouting reports to coaches or technical staff to ensure clarity and usefulness?",
        },
        {
          id: 14,
          text: "Describe a situation where you had to communicate a complex or sensitive scouting opinion. How did you handle it?",
        },
        {
          id: 15,
          text: "How do you collaborate with coaches and performance staff to align scouting with team needs?",
        },
      ],
    },
    {
      name: "Professionalism, Impact & Development",
      objective:
        "Measure self-awareness of strengths/improvement areas, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What do you consider to be your main strengths as a scout, and which areas are you actively working to improve?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as a scout, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure the quality and effectiveness of your scouting work beyond player signings, and how has your methodology evolved over time?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Scout", SCOUT_QUESTIONS);

// ─── Assistant Coach ─────────────────────────────────────────────────────────

const ASSISTANT_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Assistant Coach",
  totalScore: 100,
  categories: [
    {
      name: "Role & Support",
      objective:
        "Assess role clarity within technical staff, daily support of head coach vision, and adaptability when ideas differ.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "How do you define your role as an assistant coach within a technical staff?",
        },
        {
          id: 2,
          text: "How do you support the head coach's vision and game model on a daily basis?",
        },
        {
          id: 3,
          text: "How do you adapt when your personal ideas differ from the head coach's decisions?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate match performance analysis, tactical contribution in training, and in-game tactical correction support.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you analyze team performance during matches?",
        },
        {
          id: 5,
          text: "How do you contribute tactically during training sessions?",
        },
        {
          id: 6,
          text: "How do you support tactical corrections during games?",
        },
      ],
    },
    {
      name: "Training & Methodology",
      objective:
        "Understand session planning and delivery role, tactical principle alignment, and individual player development contribution.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "What is your role in planning and delivering training sessions?",
        },
        {
          id: 8,
          text: "How do you ensure training content aligns with the team's tactical principles?",
        },
        {
          id: 9,
          text: "How do you contribute to individual player development during the week?",
        },
      ],
    },
    {
      name: "Match Preparation & Analysis",
      objective:
        "Assess involvement in match preparation/opponent analysis, pre-match communication, and matchday role execution.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "What is your involvement in match preparation and opponent analysis?",
        },
        {
          id: 11,
          text: "How do you communicate key tactical information to players before a match?",
        },
        {
          id: 12,
          text: "What is your role during matches (bench management, feedback, observation)?",
        },
      ],
    },
    {
      name: "Communication, Leadership & Collaboration",
      objective:
        "Evaluate player communication while respecting hierarchy, handling frustrated players, and cross-staff collaboration.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you communicate with players while respecting the head coach's authority?",
        },
        {
          id: 14,
          text: "How do you handle players who are frustrated with playing time or role?",
        },
        {
          id: 15,
          text: "How do you collaborate with other staff (fitness, goalkeeper, analyst, medical)?",
        },
      ],
    },
    {
      name: "Professional Development & Evaluation",
      objective:
        "Measure self-evaluation ability, ongoing skill development, and contribution to team environment.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "How do you evaluate your own performance as an assistant coach?",
        },
        {
          id: 17,
          text: "What skills or experiences are you currently developing to grow in your coaching career?",
        },
        {
          id: 18,
          text: "How do you contribute to maintaining a positive and professional team environment?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Assistant Coach", ASSISTANT_COACH_QUESTIONS);

// ─── Specific Forward Coach ──────────────────────────────────────────────────

const SPECIFIC_FORWARD_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Specific Forward Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess pathway to becoming an attacking specific coach, role clarity within technical staff, and alignment with head coach vision.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your background and pathway to becoming an attacking specific coach?",
        },
        {
          id: 2,
          text: "How do you define the role and responsibilities of an attacking coach within a technical staff?",
        },
        {
          id: 3,
          text: "How do you align your attacking work with the head coach's overall tactical vision?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to analyze attacking patterns, teach decision-making, and train space recognition and exploitation.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you analyze attacking patterns and opponent defensive structures?",
        },
        {
          id: 5,
          text: "How do you teach decision-making in attacking situations?",
        },
        {
          id: 6,
          text: "How do you train players to recognize and exploit space in different attacking phases?",
        },
      ],
    },
    {
      name: "Attacking Methodology & Training Design",
      objective:
        "Understand session structure for individual/collective attacking behaviors, guiding principles, and age/level adaptation.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure attacking training sessions to develop individual and collective attacking behaviors?",
        },
        {
          id: 8,
          text: "What attacking principles guide your work (positioning, movement, spacing, finishing, creativity)?",
        },
        {
          id: 9,
          text: "How do you adapt your attacking methodology to different age groups and competitive levels?",
        },
      ],
    },
    {
      name: "Game Model Integration & Communication",
      objective:
        "Assess integration of attacking principles into playing model, concept communication clarity, and cross-phase coordination.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you integrate attacking principles into the team's overall playing model?",
        },
        {
          id: 11,
          text: "How do you communicate attacking concepts clearly to players to ensure understanding and execution?",
        },
        {
          id: 12,
          text: "How do you coordinate attacking organization across phases (build-up, final third, transitions, set pieces)?",
        },
      ],
    },
    {
      name: "Leadership, Collaboration & Adaptability",
      objective:
        "Evaluate collaboration with other specific coaches, adaptability when plans fail, and adjustment to different player profiles.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with other specific coaches to ensure tactical balance?",
        },
        {
          id: 14,
          text: "Describe a situation where an attacking plan failed. What adjustments did you make?",
        },
        {
          id: 15,
          text: "How do you adapt your attacking work to different player profiles?",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Development",
      objective:
        "Measure performance evaluation beyond goals, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What indicators do you use to evaluate attacking performance beyond goals scored?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as an attacking coach, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure your effectiveness as an attacking coach, and how has your methodology evolved over time?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Specific Forward Coach", SPECIFIC_FORWARD_COACH_QUESTIONS);

// ─── Specific Defensive Coach ────────────────────────────────────────────────

const SPECIFIC_DEFENSIVE_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Specific Defensive Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess pathway to becoming a defensive specific coach, role clarity within technical staff, and alignment with head coach vision.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your background and pathway to becoming a defensive specific coach?",
        },
        {
          id: 2,
          text: "How do you define the role and responsibilities of a defensive coach within a technical staff?",
        },
        {
          id: 3,
          text: "How do you align your defensive work with the head coach's overall tactical vision?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to analyze opponent attacking patterns, teach defensive decision-making/positioning, and train trigger recognition.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you analyze opponent attacking patterns and threats?",
        },
        {
          id: 5,
          text: "How do you teach defensive decision-making and positioning?",
        },
        {
          id: 6,
          text: "How do you train players to recognize defensive triggers and cues?",
        },
      ],
    },
    {
      name: "Defensive Methodology & Training Design",
      objective:
        "Understand session structure for individual/collective defensive behaviors, guiding principles, and age/level adaptation.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure defensive training sessions to develop individual and collective defensive behaviors?",
        },
        {
          id: 8,
          text: "What defensive principles guide your work (positioning, duels, compactness, pressing)?",
        },
        {
          id: 9,
          text: "How do you adapt your defensive methodology to different age groups and competitive levels?",
        },
      ],
    },
    {
      name: "Defensive Game Model & Communication",
      objective:
        "Assess integration of defensive principles into playing model, phase-specific organization, and concept communication clarity.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you integrate defensive principles into the team's overall playing model?",
        },
        {
          id: 11,
          text: "How do you work on defensive organization in different phases (block, transition, set pieces)?",
        },
        {
          id: 12,
          text: "How do you communicate defensive concepts clearly to players to ensure understanding and execution?",
        },
      ],
    },
    {
      name: "Leadership, Collaboration & Adaptability",
      objective:
        "Evaluate collaboration with other specific coaches, adaptability when plans fail, and adjustment to different player profiles.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with other specific coaches to ensure tactical balance?",
        },
        {
          id: 14,
          text: "Describe a situation where a defensive plan did not work as expected. What adjustments did you make?",
        },
        {
          id: 15,
          text: "How do you adapt your defensive work when players have different profiles, strengths, or limitations?",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Development",
      objective:
        "Measure performance evaluation beyond goals conceded, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What indicators do you use to evaluate defensive performance beyond goals conceded?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as a defensive coach, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure your effectiveness as a defensive coach, and how has your methodology evolved over time?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Specific Defensive Coach", SPECIFIC_DEFENSIVE_COACH_QUESTIONS);

// ─── Specific Technical Coach ────────────────────────────────────────────────

const SPECIFIC_TECHNICAL_COACH_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Specific Technical Coach",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess coaching pathway, role clarity within technical staff, and alignment with head coach philosophy.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your coaching background and pathway to becoming a technical coach?",
        },
        {
          id: 2,
          text: "How do you define the role and responsibilities of a technical coach within a technical staff?",
        },
        {
          id: 3,
          text: "How do you align your technical work with the head coach's playing philosophy and objectives?",
        },
      ],
    },
    {
      name: "Technical & Tactical Expertise",
      objective:
        "Evaluate ability to analyze technical execution in match play, skill prioritization by position, and decision-making linked to technique.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you analyze player technical execution during match play?",
        },
        {
          id: 5,
          text: "How do you prioritize which technical skills to develop for different positions?",
        },
        {
          id: 6,
          text: "How do you evaluate decision-making quality linked to technical execution?",
        },
      ],
    },
    {
      name: "Technical Methodology & Skill Development",
      objective:
        "Understand session structure for core skills, guiding methodology principles, and adaptation across age groups/positions/levels.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you structure technical training sessions to develop core skills (first touch, passing, receiving, ball mastery)?",
        },
        {
          id: 8,
          text: "What principles guide your technical coaching methodology?",
        },
        {
          id: 9,
          text: "How do you adapt technical work to different age groups, positions, and levels of play?",
        },
      ],
    },
    {
      name: "Game Application & Communication",
      objective:
        "Assess connection of technical exercises to game situations, integration into collective training, and feedback communication.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you connect technical training exercises to game situations and decision-making?",
        },
        {
          id: 11,
          text: "How do you integrate individual technical development into collective team training?",
        },
        {
          id: 12,
          text: "How do you communicate technical feedback to players to ensure understanding and progression?",
        },
      ],
    },
    {
      name: "Collaboration, Adaptability & Problem Solving",
      objective:
        "Evaluate cross-staff collaboration, adaptability when approaches fail, and adjustment for different learning speeds/limitations.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you collaborate with tactical, physical, and mental staff to ensure coherent player development?",
        },
        {
          id: 14,
          text: "Describe a situation where a technical training approach did not produce the expected results. What adjustments did you make?",
        },
        {
          id: 15,
          text: "How do you adapt your technical coaching when players have different learning speeds or limitations?",
        },
      ],
    },
    {
      name: "Professionalism, Evaluation & Development",
      objective:
        "Measure technical improvement evaluation beyond match performance, professional resilience, and methodology evolution.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "What indicators do you use to evaluate technical improvement in players beyond match performance?",
        },
        {
          id: 17,
          text: "What has been the toughest professional challenge you have faced as a technical coach, and how did you overcome it?",
        },
        {
          id: 18,
          text: "How do you measure your effectiveness as a technical coach, and how has your methodology evolved over time?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Specific Technical Coach", SPECIFIC_TECHNICAL_COACH_QUESTIONS);

// ─── Academy Director ────────────────────────────────────────────────────────

const ACADEMY_DIRECTOR_QUESTIONS: IVideoScoringQuestionSet = {
  role: CandidateRole.ON_FIELD_STAFF,
  position: "Academy Director",
  totalScore: 100,
  categories: [
    {
      name: "Background & Role Definition",
      objective:
        "Assess professional pathway, understanding of academy director mission, and leadership principles for long-term development.",
      maxScore: 20,
      questions: [
        {
          id: 1,
          text: "Can you describe your professional pathway and the experiences that prepared you to lead an academy?",
        },
        {
          id: 2,
          text: "How would you define the mission of an academy director within a modern football organization?",
        },
        {
          id: 3,
          text: "What leadership principles guide your decisions when managing a long-term development structure?",
        },
      ],
    },
    {
      name: "Technical & Development Expertise",
      objective:
        "Evaluate consistency of technical/tactical standards across age groups, session quality assessment, and player progression measurement.",
      maxScore: 20,
      questions: [
        {
          id: 4,
          text: "How do you ensure technical and tactical standards are consistent across all age groups?",
        },
        {
          id: 5,
          text: "How do you evaluate whether training sessions meet development objectives?",
        },
        {
          id: 6,
          text: "What indicators do you use to measure real player progression?",
        },
      ],
    },
    {
      name: "Academy Philosophy & Methodology",
      objective:
        "Understand unified development philosophy design, balancing consistency with coaching identity, and long-term development model principles.",
      maxScore: 20,
      questions: [
        {
          id: 7,
          text: "How do you design and implement a unified development philosophy across the academy?",
        },
        {
          id: 8,
          text: "How do you maintain consistency while allowing coaches freedom to express their coaching identity?",
        },
        {
          id: 9,
          text: "What principles guide your long-term player development model?",
        },
      ],
    },
    {
      name: "Staff Leadership & Coach Development",
      objective:
        "Assess coach recruitment, mentoring and evaluation processes, coaching quality monitoring, and professional growth support.",
      maxScore: 15,
      questions: [
        {
          id: 10,
          text: "How do you recruit, mentor, and evaluate academy coaches?",
        },
        {
          id: 11,
          text: "What tools or methods do you use to monitor coaching quality?",
        },
        {
          id: 12,
          text: "How do you support coaches in their professional growth and licensing pathway?",
        },
      ],
    },
    {
      name: "Player Pathway & Performance Model",
      objective:
        "Evaluate grassroots-to-elite progression structure, multi-domain development integration, and age-group transition management.",
      maxScore: 15,
      questions: [
        {
          id: 13,
          text: "How do you structure player progression from grassroots to elite level?",
        },
        {
          id: 14,
          text: "How do you integrate technical, tactical, physical, and mental development into one system?",
        },
        {
          id: 15,
          text: "How do you manage transitions between age groups and competitive levels?",
        },
      ],
    },
    {
      name: "Organizational Leadership & Impact",
      objective:
        "Measure cross-department collaboration, academy success metrics beyond results, and strategic prioritization ability.",
      maxScore: 10,
      questions: [
        {
          id: 16,
          text: "How do you collaborate with technical staff, performance departments, and club leadership?",
        },
        {
          id: 17,
          text: "What metrics do you use to evaluate academy success beyond match results?",
        },
        {
          id: 18,
          text: "If appointed today, what would be your priorities during your first 90 days?",
        },
      ],
    },
  ],
};

registerOnFieldStaffQuestions("Academy Director", ACADEMY_DIRECTOR_QUESTIONS);

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
