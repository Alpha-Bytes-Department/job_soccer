import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CandidateResumeService } from "./candidateResume.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import AppError from "../../errors/AppError";
import unlinkFile from "../../shared/util/unlinkFile";
import path from "path";

/**
 * Add a new resume for a candidate
 * POST /api/v1/candidate-resume
 */
const addResume = catchAsync(async (req: Request, res: Response) => {
  // Parse form-data: the data field contains JSON string
  let parsedData;

  try {
    parsedData = req.body.data ? JSON.parse(req.body.data) : req.body;
  } catch (parseError) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid JSON format in data field"
    );
  }
  const { userId, setAsActive } = parsedData;

  // Check if file was uploaded
  if (!req.files || !("doc" in req.files)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Resume file is required");
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const resumeFile = files["doc"][0];

  try {
    const result = await CandidateResumeService.addResume(
      userId,
      resumeFile,
      setAsActive === true || setAsActive === "true"
    );

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Resume uploaded successfully",
      data: result,
    });
  } catch (error) {
    // Delete the uploaded file if resume addition fails
    try {
      await unlinkFile(path.join("docs", resumeFile.filename));
    } catch (unlinkError) {
      console.error("Error deleting uploaded file:", unlinkError);
    }
    // Re-throw the original error
    throw error;
  }
});

/**
 * Get all resumes for a user
 * GET /api/v1/candidate-resume/user/:userId
 */
const getAllResumes = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await CandidateResumeService.getAllResumes(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resumes retrieved successfully",
    data: result,
  });
});

/**
 * Get a specific resume by ID
 * GET /api/v1/candidate-resume/:resumeId
 */
const getResumeById = catchAsync(async (req: Request, res: Response) => {
  const { resumeId } = req.params;

  const result = await CandidateResumeService.getResumeById(resumeId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resume retrieved successfully",
    data: result,
  });
});

/**
 * Get active resume for a user
 * GET /api/v1/candidate-resume/user/:userId/active
 */
const getActiveResume = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await CandidateResumeService.getActiveResume(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result
      ? "Active resume retrieved successfully"
      : "No active resume found",
    data: result,
  });
});

/**
 * Remove a specific resume
 * DELETE /api/v1/candidate-resume/:resumeId
 */
const removeResume = catchAsync(async (req: Request, res: Response) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;

  await CandidateResumeService.removeResume(resumeId, userId!);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resume removed successfully",
    data: null,
  });
});

/**
 * Set a resume as active
 * PATCH /api/v1/candidate-resume/:resumeId/activate
 */
const setActiveResume = catchAsync(async (req: Request, res: Response) => {
  const { resumeId } = req.params;
  const userId = req.user?.id;

  const result = await CandidateResumeService.setActiveResume(
    resumeId,
    userId!
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resume set as active successfully",
    data: result,
  });
});

/**
 * Get active resumes for multiple users (bulk)
 * POST /api/v1/candidate-resume/bulk/active
 */
const getActiveResumesByUsers = catchAsync(
  async (req: Request, res: Response) => {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "userIds must be a non-empty array"
      );
    }

    const result = await CandidateResumeService.getActiveResumesByUsers(
      userIds
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Active resumes retrieved successfully",
      data: result,
    });
  }
);

/**
 * Get all resumes for multiple users (bulk)
 * POST /api/v1/candidate-resume/bulk
 */
const getResumesByUsers = catchAsync(async (req: Request, res: Response) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "userIds must be a non-empty array"
    );
  }

  const result = await CandidateResumeService.getResumesByUsers(userIds);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resumes retrieved successfully",
    data: result,
  });
});

/**
 * Check if a user has any resumes
 * GET /api/v1/candidate-resume/user/:userId/check
 */
const checkHasResume = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const hasResume = await CandidateResumeService.hasResume(userId);
  const count = await CandidateResumeService.getResumeCount(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Resume status retrieved successfully",
    data: { hasResume, count },
  });
});

export const CandidateResumeController = {
  addResume,
  getAllResumes,
  getResumeById,
  getActiveResume,
  removeResume,
  setActiveResume,
  getActiveResumesByUsers,
  getResumesByUsers,
  checkHasResume,
};
