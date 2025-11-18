import { openai, OPENAI_CONFIG } from "./openai.config";
import { logger } from "../logger/logger";

/**
 * Calculate AI match percentage between a job and candidate profile
 * @param jobData - The job posting data
 * @param candidateProfile - The candidate's complete profile data
 * @param candidateRole - The candidate's role
 * @returns Promise<number> - Match score out of 100
 */
export async function calculateJobMatchScore(
  jobData: Record<string, any>,
  candidateProfile: Record<string, any>,
  candidateRole: string
): Promise<number> {
  try {
    // Build the matching prompt
    const prompt = buildJobMatchPrompt(jobData, candidateProfile, candidateRole);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: OPENAI_CONFIG.model,
      temperature: 0.3,
      max_completion_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are an expert soccer/football recruitment analyst. Your task is to evaluate how well a candidate matches a job posting. Analyze the job requirements against the candidate's profile and provide a numerical match score out of 100. Be objective and thorough. Return ONLY a number between 0 and 100, nothing else.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Log for debugging
    logger.info("OpenAI Job Match API Response:", {
      usage: completion.usage,
      model: completion.model,
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      logger.error("OpenAI returned empty response for job matching");
      return 0;
    }

    // Extract the score from the response
    const score = parseInt(responseContent, 10);

    // Validate the score
    if (isNaN(score) || score < 0 || score > 100) {
      logger.error(`Invalid match score received from OpenAI: ${responseContent}`);
      return 0;
    }

    logger.info(`Generated AI job match score: ${score}`);
    return score;
  } catch (error) {
    logger.error("Error calculating job match score:", error);
    // Return 0 instead of throwing to prevent application failure
    return 0;
  }
}

/**
 * Build the job matching prompt
 */
function buildJobMatchPrompt(
  jobData: Record<string, any>,
  candidateProfile: Record<string, any>,
  candidateRole: string
): string {
  let prompt = `Evaluate how well this candidate matches the job requirements and provide a match score out of 100.

JOB POSTING:
- Title: ${jobData.jobTitle}
- Category: ${jobData.jobCategory}
- Position: ${jobData.position}
- Contract Type: ${jobData.contractType}
- Location: ${jobData.location}
- Experience Required: ${jobData.experience}
- Salary Range: ${jobData.salary?.min} - ${jobData.salary?.max}
- Required Skills: ${jobData.requiredSkills}
- Requirements: ${jobData.requirements}
- Responsibilities: ${jobData.responsibilities}
${jobData.additionalRequirements ? `- Additional Requirements: ${jobData.additionalRequirements}` : ""}

CANDIDATE PROFILE:
- Role: ${candidateRole}
`;

  // Add role-specific candidate details
  if (candidateProfile.position) {
    prompt += `- Position: ${candidateProfile.position}\n`;
  }
  if (candidateProfile.currentClub) {
    prompt += `- Current Club: ${candidateProfile.currentClub}\n`;
  }
  if (candidateProfile.division) {
    prompt += `- Division/Level: ${candidateProfile.division}\n`;
  }
  if (candidateProfile.totalYearsOfExperience) {
    prompt += `- Total Years of Experience: ${candidateProfile.totalYearsOfExperience}\n`;
  }
  if (candidateProfile.yearsOfExperience) {
    prompt += `- Years of Experience: ${candidateProfile.yearsOfExperience}\n`;
  }
  if (candidateProfile.height) {
    prompt += `- Height: ${candidateProfile.height.size} ${candidateProfile.height.unit}\n`;
  }
  if (candidateProfile.weight) {
    prompt += `- Weight: ${candidateProfile.weight.size} ${candidateProfile.weight.unit}\n`;
  }
  if (candidateProfile.foot) {
    prompt += `- Preferred Foot: ${candidateProfile.foot}\n`;
  }
  if (candidateProfile.nationality) {
    prompt += `- Nationality: ${candidateProfile.nationality}\n`;
  }
  if (candidateProfile.availability) {
    prompt += `- Availability: ${candidateProfile.availability}\n`;
  }
  if (candidateProfile?.gpa) {
    prompt += `- GPA: ${candidateProfile.gpa || "N/A"}\n`;
  }
  if (candidateProfile.educationLevel) {
    prompt += `- Education Level: ${candidateProfile.educationLevel}\n`;
  }
  if (candidateProfile.currentEmployer) {
    prompt += `- Current Employer: ${candidateProfile.currentEmployer}\n`;
  }

  // Add experience history if available
  if (candidateProfile.experiences && candidateProfile.experiences.length > 0) {
    prompt += `\nWORK EXPERIENCE HISTORY:\n`;
    candidateProfile.experiences.forEach((exp: any, index: number) => {
      prompt += `${index + 1}. ${exp.title} at ${exp.club} (${exp.employmentType})\n`;
      prompt += `   Location: ${exp.location}\n`;
      prompt += `   Duration: ${exp.startMonth} ${exp.startYear} - ${exp.isCurrentlyWorking ? 'Present' : `${exp.endMonth} ${exp.endYear}`}\n`;
      if (exp.description) {
        prompt += `   Description: ${exp.description}\n`;
      }
      prompt += `\n`;
    });
  }

  // Add education history if available
  if (candidateProfile.educations && candidateProfile.educations.length > 0) {
    prompt += `\nEDUCATION HISTORY:\n`;
    candidateProfile.educations.forEach((edu: any, index: number) => {
      prompt += `${index + 1}. ${edu.degree} in ${edu.fieldOfStudy}\n`;
      prompt += `   Institution: ${edu.instituteName}\n`;
      prompt += `   Duration: ${edu.startMonth} ${edu.startYear} - ${edu.endMonth ? `${edu.endMonth} ${edu.endYear}` : 'Present'}\n`;
      if (edu.grade) {
        prompt += `   Grade: ${edu.grade}\n`;
      }
      if (edu.description) {
        prompt += `   Description: ${edu.description}\n`;
      }
      prompt += `\n`;
    });
  }

  // Add certifications if available
  if (candidateProfile.certifications && candidateProfile.certifications.length > 0) {
    prompt += `\nLICENSES & CERTIFICATIONS:\n`;
    candidateProfile.certifications.forEach((cert: any, index: number) => {
      prompt += `${index + 1}. ${cert.name}\n`;
      prompt += `   Issuing Organization: ${cert.issuingOrganization}\n`;
      prompt += `   Issued: ${cert.startMonth} ${cert.startYear}`;
      if (cert.endMonth && cert.endYear) {
        prompt += ` - Expires: ${cert.endMonth} ${cert.endYear}`;
      }
      prompt += `\n`;
      if (cert.credentialId) {
        prompt += `   Credential ID: ${cert.credentialId}\n`;
      }
      if (cert.credentialUrl) {
        prompt += `   Credential URL: ${cert.credentialUrl}\n`;
      }
      if (cert.description) {
        prompt += `   Description: ${cert.description}\n`;
      }
      prompt += `\n`;
    });
  }

  // Add complete profile data as JSON for AI analysis
  prompt += `\nCOMPLETE CANDIDATE PROFILE DATA:\n${JSON.stringify(candidateProfile, null, 2)}\n`;

  prompt += `
SCORING INSTRUCTIONS:
1. Compare the job requirements with the candidate's qualifications
2. Evaluate position match, experience level, skills alignment, and location compatibility
3. Consider if the candidate meets the essential requirements
4. A score of 100 means perfect match in all aspects
5. A score of 70-85 means good match with minor gaps
6. A score of 50-69 means moderate match with some important gaps
7. A score below 50 means significant gaps or mismatches
8. Be objective and thorough in your evaluation

Return ONLY a number between 0 and 100.`;

  return prompt;
}
