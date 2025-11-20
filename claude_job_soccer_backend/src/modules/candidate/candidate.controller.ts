import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CandidateServices } from "./candidate.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";

/**
 * Search candidates by name, category, and country
 * Semi-private: Authenticated users get filtered results
 * Query params: searchTerm, role, country, page, limit, sortBy
 */
const searchCandidates = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id; // Optional - may be undefined for unauthenticated users
  const result = await CandidateServices.searchCandidates(req.query, userId);
     
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Candidates retrieved successfully",
    data: result.result,
    meta: result.meta,
  });
});

/**
 * Get featured candidates grouped by category
 * Returns max 4 candidates per category
 */
const getFeaturedCandidates = catchAsync(async (req: Request, res: Response) => {
  const result = await CandidateServices.getFeaturedCandidates();
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Featured candidates retrieved successfully",
    data: result,
  });
});

/**
 * Get candidate by ID with full profile details
 */
const getCandidateById = catchAsync(async (req: Request, res: Response) => {
  const result = await CandidateServices.getCandidateById(req.params.id);
  
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Candidate retrieved successfully",
    data: result,
  });
});

export const CandidateController = {
  searchCandidates,
  getFeaturedCandidates,
  getCandidateById,
};
