import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import os from "os";
import { openai } from "./openai.config";
import { CandidateRole } from "../../modules/user/user.interface";
import { logger } from "../logger/logger";
import {
  getVideoScoringQuestions,
  hasVideoScoringQuestions,
  IVideoScoringQuestionSet,
} from "../constant/videoScoringQuestions.config";

/**
 * Video Scoring Service
 *
 * Transcribes staff videos using OpenAI Whisper, then evaluates
 * the transcript against role/position-specific questions using GPT.
 *
 * Flow:
 * 1. Extract audio from each video via ffmpeg (reduces ~50MB video → ~3MB audio)
 * 2. Transcribe extracted audio via Whisper API (in parallel)
 * 3. Combine all transcripts
 * 4. Send combined transcript + evaluation questions to GPT
 * 5. GPT scores each category (0 to category max)
 * 6. Return total score (0-100)
 */

// ─── Constants ───────────────────────────────────────────────────────────────

const WHISPER_MODEL = "whisper-1";
const SCORING_MODEL = "gpt-4o-mini";
const SCORING_TEMPERATURE = 0.2;
const SCORING_MAX_TOKENS = 1000;

// Max file size for Whisper API (25MB) — after audio extraction, files are ~2-5MB
const MAX_WHISPER_FILE_SIZE = 25 * 1024 * 1024;

// ─── Audio Extraction ────────────────────────────────────────────────────────

/**
 * Check if ffmpeg is available on the system.
 */
let _ffmpegAvailable: boolean | null = null;
function isFfmpegAvailable(): boolean {
  if (_ffmpegAvailable !== null) return _ffmpegAvailable;
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    _ffmpegAvailable = true;
  } catch {
    _ffmpegAvailable = false;
    logger.warn("ffmpeg not found — video files will be sent directly to Whisper (may fail for large files)");
  }
  return _ffmpegAvailable;
}

/**
 * Extract audio from a video file using ffmpeg.
 * Converts to mp3 at 64kbps mono — produces ~0.5MB per minute.
 * Returns the path to the extracted audio file, or null if extraction fails.
 */
function extractAudio(videoPath: string): string | null {
  if (!isFfmpegAvailable()) return null;

  try {
    const tempDir = os.tmpdir();
    const audioFileName = `whisper_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`;
    const audioPath = path.join(tempDir, audioFileName);

    // Extract audio: mono, 64kbps mp3 — optimized for speech
    execSync(
      `ffmpeg -i "${videoPath}" -vn -ac 1 -ab 64k -ar 16000 -f mp3 "${audioPath}" -y`,
      { stdio: "ignore", timeout: 60000 } // 60s timeout
    );

    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      logger.info(
        `Audio extracted: ${(stats.size / 1024 / 1024).toFixed(2)}MB from ${path.basename(videoPath)}`
      );
      return audioPath;
    }
    return null;
  } catch (error: any) {
    logger.error(`Failed to extract audio from ${videoPath}:`, {
      error: error.message,
    });
    return null;
  }
}

/**
 * Clean up a temporary audio file.
 */
function cleanupTempFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore cleanup errors
  }
}

// ─── Transcription ───────────────────────────────────────────────────────────

/**
 * Transcribe a single video file using OpenAI Whisper API.
 * If ffmpeg is available, extracts audio first (much smaller file).
 * Falls back to sending the raw video if extraction fails.
 */
async function transcribeVideo(filePath: string): Promise<string> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  // Check file exists
  if (!fs.existsSync(absolutePath)) {
    logger.warn(`Video file not found for transcription: ${absolutePath}`);
    return "";
  }

  // Try to extract audio first (handles large video files)
  let fileToTranscribe = absolutePath;
  let tempAudioPath: string | null = null;

  const stats = fs.statSync(absolutePath);
  if (stats.size > MAX_WHISPER_FILE_SIZE || isFfmpegAvailable()) {
    // Always extract audio if ffmpeg is available (cheaper & faster upload)
    tempAudioPath = extractAudio(absolutePath);
    if (tempAudioPath) {
      fileToTranscribe = tempAudioPath;
    } else if (stats.size > MAX_WHISPER_FILE_SIZE) {
      // Can't extract audio and file is too large
      logger.warn(
        `Video file too large (${(stats.size / 1024 / 1024).toFixed(1)}MB) and ffmpeg unavailable — skipping`
      );
      return "";
    }
  }

  try {
    const fileStream = fs.createReadStream(fileToTranscribe);

    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: WHISPER_MODEL,
      language: "en", // Can be made configurable
    });

    return transcription.text || "";
  } catch (error: any) {
    logger.error(`Failed to transcribe video: ${absolutePath}`, {
      error: error.message,
    });
    return "";
  } finally {
    // Clean up temp audio file
    if (tempAudioPath) cleanupTempFile(tempAudioPath);
  }
}

/**
 * Transcribe multiple video files in parallel and combine their transcripts.
 */
async function transcribeAllVideos(filePaths: string[]): Promise<string> {
  // Transcribe all videos in parallel
  const results = await Promise.all(
    filePaths.map((filePath) => transcribeVideo(filePath))
  );

  const transcripts = results.filter((t) => t.trim().length > 0);

  if (transcripts.length === 0) {
    logger.warn("No transcripts generated from any video files");
    return "";
  }

  return transcripts.join("\n\n---\n\n");
}

// ─── Evaluation ──────────────────────────────────────────────────────────────

/**
 * Build the GPT evaluation prompt from questions and transcript.
 */
function buildEvaluationPrompt(
  transcript: string,
  questionSet: IVideoScoringQuestionSet
): string {
  const categoriesText = questionSet.categories
    .map((cat, index) => {
      const questionsText = cat.questions
        .map((q) => `  - Q${q.id}: ${q.text}`)
        .join("\n");

      return `Category ${index + 1}: "${cat.name}" (Max: ${cat.maxScore} points)
  Objective: ${cat.objective}
  Questions:
${questionsText}`;
    })
    .join("\n\n");

  const categoryKeys = questionSet.categories
    .map((c) => `"${c.name}": <score 0-${c.maxScore}>`)
    .join(", ");

  return `You are an expert football/soccer recruitment evaluator. 
You are evaluating a candidate's pre-recorded video interview for a staff position in a football organization.

Below is the transcript of the candidate's video response(s):

--- TRANSCRIPT START ---
${transcript}
--- TRANSCRIPT END ---

Evaluate the transcript against these criteria. For each category, assess how well the candidate's responses address the questions. Score each category from 0 to the maximum score specified.

EVALUATION CATEGORIES:

${categoriesText}

SCORING GUIDELINES:
- Score based ONLY on what is present in the transcript
- If the candidate does not address a category at all, give 0 for that category
- If partially addressed, give proportional score
- If well addressed with specific examples and depth, give close to max
- Be fair and objective. Assess quality, depth, specificity, and relevance of responses
- Total possible score: ${questionSet.totalScore}

PER-QUESTION QUALITY SCALE (use to calibrate category scores):
- 0 = No evidence (no answer or irrelevant)
- 1 = Very weak (vague or theoretical only)
- 2 = Weak (limited practical experience shown)
- 3 = Acceptable (clear response with relevant examples)
- 4 = Strong (structured response with applied impact)
- 5 = Elite (high-level, consistent, scalable professional performance)

Respond with ONLY valid JSON in this exact format:
{
  "categoryScores": { ${categoryKeys} },
  "totalScore": <sum of all category scores>,
  "brief": "<1-2 sentence overall assessment>"
}`;
}

/**
 * Evaluate a combined transcript against the scoring question set.
 * Returns category scores and total score.
 */
async function evaluateTranscript(
  transcript: string,
  questionSet: IVideoScoringQuestionSet
): Promise<{
  totalScore: number;
  categoryScores: Record<string, number>;
  brief: string;
}> {
  const prompt = buildEvaluationPrompt(transcript, questionSet);

  try {
    const completion = await openai.chat.completions.create({
      model: SCORING_MODEL,
      temperature: SCORING_TEMPERATURE,
      max_completion_tokens: SCORING_MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert football/soccer recruitment evaluator. You score candidate video interviews objectively. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseContent = completion.choices[0]?.message?.content?.trim();
    if (!responseContent) {
      logger.error("OpenAI returned empty response for video scoring");
      return { totalScore: 0, categoryScores: {}, brief: "" };
    }

    const parsed = JSON.parse(responseContent);

    // Validate and clamp scores
    const categoryScores: Record<string, number> = {};
    let totalScore = 0;

    for (const cat of questionSet.categories) {
      const rawScore = parsed.categoryScores?.[cat.name];
      const score = Math.min(
        Math.max(0, Math.round(Number(rawScore) || 0)),
        cat.maxScore
      );
      categoryScores[cat.name] = score;
      totalScore += score;
    }

    return {
      totalScore,
      categoryScores,
      brief: parsed.brief || "",
    };
  } catch (error: any) {
    logger.error("Failed to evaluate video transcript", {
      error: error.message,
    });
    return { totalScore: 0, categoryScores: {}, brief: "" };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface IVideoScoreResult {
  totalScore: number;
  categoryScores: Record<string, number>;
  brief: string;
  transcriptLength: number;
}

/**
 * Score staff videos from multer file objects (during upload).
 * Uses the absolute file paths from multer.
 *
 * @param videoFiles - Express.Multer.File[] from the upload
 * @param role - CandidateRole (OFFICE_STAFF or ON_FIELD_STAFF)
 * @param position - Staff position (used for ON_FIELD_STAFF question selection)
 * @returns Score result with total score 0-100
 */
export async function scoreStaffVideosFromUpload(params: {
  videoFiles: Express.Multer.File[];
  role: CandidateRole;
  position: string;
}): Promise<IVideoScoreResult> {
  const { videoFiles, role, position } = params;

  // Check if scoring is available for this role/position
  if (!hasVideoScoringQuestions(role, position)) {
    logger.info(
      `Video scoring not configured for role: ${role}, position: ${position}`
    );
    return { totalScore: 0, categoryScores: {}, brief: "", transcriptLength: 0 };
  }

  const questionSet = getVideoScoringQuestions(role, position)!;

  // Get file paths from multer objects
  const filePaths = videoFiles.map((f) => f.path);

  logger.info(
    `Starting video scoring for ${role} - ${position} (${filePaths.length} videos)`
  );

  // Step 1: Transcribe all videos
  const transcript = await transcribeAllVideos(filePaths);
  if (!transcript.trim()) {
    logger.warn("Empty transcript — cannot score videos");
    return { totalScore: 0, categoryScores: {}, brief: "No speech detected in videos", transcriptLength: 0 };
  }

  logger.info(
    `Transcription complete: ${transcript.length} characters from ${filePaths.length} videos`
  );

  // Step 2: Evaluate transcript
  const result = await evaluateTranscript(transcript, questionSet);

  logger.info(
    `Video scoring complete for ${role} - ${position}: ${result.totalScore}/100`
  );

  return {
    ...result,
    transcriptLength: transcript.length,
  };
}

/**
 * Score staff videos from stored video URLs (for re-scoring existing profiles).
 * Resolves relative paths (e.g., "videos/file.mp4") to absolute paths.
 *
 * @param videoUrls - Array of stored video URL paths (relative to uploads/)
 * @param role - CandidateRole
 * @param position - Staff position
 * @returns Score result with total score 0-100
 */
export async function scoreStaffVideosFromStored(params: {
  videoUrls: string[];
  role: CandidateRole;
  position: string;
}): Promise<IVideoScoreResult> {
  const { videoUrls, role, position } = params;

  // Check if scoring is available for this role/position
  if (!hasVideoScoringQuestions(role, position)) {
    logger.info(
      `Video scoring not configured for role: ${role}, position: ${position}`
    );
    return { totalScore: 0, categoryScores: {}, brief: "", transcriptLength: 0 };
  }

  const questionSet = getVideoScoringQuestions(role, position)!;

  // Resolve relative paths to absolute
  const filePaths = videoUrls.map((url) =>
    path.join(process.cwd(), "uploads", url)
  );

  logger.info(
    `Starting video re-scoring for ${role} - ${position} (${filePaths.length} videos)`
  );

  // Step 1: Transcribe all videos
  const transcript = await transcribeAllVideos(filePaths);
  if (!transcript.trim()) {
    logger.warn("Empty transcript — cannot score videos");
    return { totalScore: 0, categoryScores: {}, brief: "No speech detected in videos", transcriptLength: 0 };
  }

  // Step 2: Evaluate transcript
  const result = await evaluateTranscript(transcript, questionSet);

  logger.info(
    `Video re-scoring complete for ${role} - ${position}: ${result.totalScore}/100`
  );

  return {
    ...result,
    transcriptLength: transcript.length,
  };
}
