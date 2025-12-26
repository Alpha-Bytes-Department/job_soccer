import { promises as fs } from "fs";
import {
  IVideoMetadata,
  IVideoValidationResult,
  IVideo,
} from "../constant/video.constant";
import {
  getVideoRequirements,
  isOfficeStaff,
  validateOfficeStaffVideoCount,
} from "../constant/videoRequirements.config";

/**
 * Convert absolute file path to relative path for storage
 * Example: /app/uploads/videos/file.mp4 -> videos/file.mp4
 */
const getRelativePath = (absolutePath: string): string => {
  const videosIndex = absolutePath.indexOf('videos/');
  if (videosIndex !== -1) {
    return absolutePath.substring(videosIndex);
  }
  return absolutePath; // Fallback to original if 'videos/' not found
};

/**
 * Get video duration - DISABLED (handled by frontend)
 * Returns 0 as duration will be validated on frontend
 */
export const getVideoDuration = async (
  filePath: string
): Promise<number> => {
  // Duration validation is handled by frontend
  return 0;
};

/**
 * Validate videos based on position requirements
 */
export const validateVideos = async (
  position: string,
  videoMetadata: IVideoMetadata[],
  videoFiles: Express.Multer.File[]
): Promise<IVideoValidationResult> => {
  // Check if files match metadata
  if (videoFiles.length !== videoMetadata.length) {
    return {
      isValid: false,
      error: `Mismatch: ${videoFiles.length} files uploaded but ${videoMetadata.length} metadata entries provided`,
    };
  }

  // Get requirements for this position
  let requirements;
  try {
    requirements = getVideoRequirements(position);
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    };
  }

  // Special handling for office staff (1 or 2 videos allowed)
  if (isOfficeStaff(position)) {
    if (!validateOfficeStaffVideoCount(videoFiles.length)) {
      return {
        isValid: false,
        error: `${position} requires 1 or 2 videos (Pre-recorded Interview is mandatory, Methodology is optional)`,
      };
    }
  } else {
    // For non-office staff, exact count required
    if (videoFiles.length !== requirements.totalVideos) {
      return {
        isValid: false,
        error: `${position} requires exactly ${requirements.totalVideos} videos, received ${videoFiles.length}`,
      };
    }
  }

  // Extract submitted types
  const submittedTypes = videoMetadata.map((v) => v.type);

  // Check for required types
  const requiredTypes = requirements.requiredVideoTypes
    .filter((r) => r.required)
    .map((r) => r.type);

  for (const requiredType of requiredTypes) {
    if (!submittedTypes.includes(requiredType)) {
      return {
        isValid: false,
        error: `Missing required video type: ${requiredType}`,
      };
    }
  }

  // Check for duplicate types
  const uniqueTypes = new Set(submittedTypes);
  if (uniqueTypes.size !== submittedTypes.length) {
    return {
      isValid: false,
      error: "Duplicate video types are not allowed",
    };
  }

  // Check for forbidden types (if any)
  if (requirements.forbiddenVideoTypes) {
    for (const submittedType of submittedTypes) {
      if (requirements.forbiddenVideoTypes.includes(submittedType)) {
        return {
          isValid: false,
          error: `${submittedType} is not allowed for ${position}`,
        };
      }
    }
  }

  // Validate allowed types for this position
  const allowedTypes = requirements.requiredVideoTypes.map((r) => r.type);
  for (const submittedType of submittedTypes) {
    if (!allowedTypes.includes(submittedType)) {
      return {
        isValid: false,
        error: `${submittedType} is not a valid video type for ${position}`,
      };
    }
  }

  // Duration validation removed - handled by frontend
  // All videos will have duration set to 0
  for (let i = 0; i < videoFiles.length; i++) {
    (videoFiles[i] as any).duration = 0;
  }

  return { isValid: true };
};

/**
 * Process videos after validation (for staff with video types)
 * Maps video files with metadata and prepares for storage
 */
export const processVideos = async (
  videoFiles: Express.Multer.File[],
  videoMetadata: IVideoMetadata[]
): Promise<Partial<IVideo>[]> => {
  return videoFiles.map((file, index) => {
    const metadata = videoMetadata[index];
    const duration = (file as any).duration || 0;

    return {
      videoType: metadata.type,
      url: getRelativePath(file.path), 
      duration: duration,
      title: metadata.title,
      description: metadata.description,
      uploadedAt: new Date(),
    };
  });
};

/**
 * Process player videos (all are Highlights, no videoType needed)
 * Maps video files with titles only
 */
export const processPlayerVideos = async (
  videoFiles: Express.Multer.File[],
  videoTitles: string[]
): Promise<any[]> => {
  return videoFiles.map((file, index) => {
    const duration = (file as any).duration || 0;
    const title = videoTitles[index] || `Highlights ${index + 1}`;

    return {
      url: getRelativePath(file.path),
      duration: duration,
      title: title,
      uploadedAt: new Date(),
    };
  });
};

/**
 * Clean up uploaded files from local storage
 * Use this when validation fails or on error
 */
export const cleanupUploadedFiles = async (
  files: Express.Multer.File[]
): Promise<void> => {
  if (!files || files.length === 0) {
    return;
  }

  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
        console.log(`Deleted file: ${file.path}`);
      } catch (error) {
        console.error(`Failed to delete file: ${file.path}`, error);
      }
    })
  );
};

/**
 * Validate player videos (simpler validation - just 2 highlights)
 */
export const validatePlayerVideos = async (
  videoFiles: Express.Multer.File[],
  playerType: "Professional Player" | "Amateur Player" | "High School Player" | "College/University Player"
): Promise<IVideoValidationResult> => {
  // Players need exactly 2 videos
  if (videoFiles.length !== 2) {
    return {
      isValid: false,
      error: `${playerType} requires exactly 2 Highlights videos, received ${videoFiles.length}`,
    };
  }

  // Duration validation removed - handled by frontend
  // All videos will have duration set to 0
  for (let i = 0; i < videoFiles.length; i++) {
    (videoFiles[i] as any).duration = 0;
  }

  return { isValid: true };
};

/**
 * Helper to extract video files from request
 */
export const extractVideoFiles = (req: any): Express.Multer.File[] => {
  return (req.files as { [fieldname: string]: Express.Multer.File[] })
    ?.videos || [];
};
