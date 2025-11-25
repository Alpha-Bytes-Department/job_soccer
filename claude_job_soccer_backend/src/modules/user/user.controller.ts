import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { UserServices } from "./user.service";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { 
  extractVideoFiles, 
  cleanupUploadedFiles 
} from "../../shared/util/videoHelper";
import AppError from "../../errors/AppError";




const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const usersRes = await UserServices.getAllUsers(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully ",
    data: usersRes.result,
    meta: usersRes.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: user,
  });
});
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const data = req.body.data ? JSON.parse(req.body.data) : null;

  let image = null;
  if (req.files && "image" in req.files && req.files.image[0]) {
    image = req.files.image[0].path.replace('/app/uploads', '');

     
  }

  const userData = {
    ...data,
    image: image,
  };
  if (userData.image === null) {
    delete userData.image;
  }

  const user = await UserServices.updateUser(req.params.id, userData);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

const updateUserActivationStatus = catchAsync(
  async (req: Request, res: Response) => {
    const { status } = req.body;
    const user = await UserServices.updateUserActivationStatus(
      req.params.id,
      status
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: `User ${
        status === "active" ? "activated" : "deleted"
      } successfully`,
      data: user,
    });
  }
);

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  const user = await UserServices.updateUserRole(req.params.id, role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

//get me
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await UserServices.getMe(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

//add user profile
const addUserProfile = catchAsync(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    

    
    // Parse profile data from request
    const profileData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // Extract profile image if present
    let profileImage = null;
    if (req.files && "image" in req.files && req.files.image[0]) {
      profileImage = req.files.image[0].path.replace('/app/uploads', '');
    }
    if(profileImage === null){
     throw new AppError(400, "Profile image is required");
    }
    
    // Extract video files if present
    const videoFiles = extractVideoFiles(req);
    
    // Parse video metadata if present (for staff)
    let videoMetadata = null;
    if (req.body.videoMeta) {
      videoMetadata = JSON.parse(req.body.videoMeta);
    }
    
    // Parse video titles if present (for players)
    let videoTitles = null;
    if (req.body.videoTitles) {
      videoTitles = JSON.parse(req.body.videoTitles);
    }

    // Call service with all data
    const result = await UserServices.addUserProfile({
      userId,
      data: profileData,
      profileImage,
      videoFiles,
      videoMetadata,
      videoTitles,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "User profile created successfully",
      data: result,
    });
  } catch (error) {
    // Clean up uploaded video files on error
    const videoFiles = extractVideoFiles(req);
    await cleanupUploadedFiles(videoFiles);
    throw error;
  }
});

//update user profile
const updateUserProfile = catchAsync(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Parse profile data from request
    const profileData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // Extract profile image if present
    let profileImage = null;
    if (req.files && "image" in req.files && req.files.image[0]) {
      profileImage = req.files.image[0].path.replace('/app/uploads', '');
    }
    
    // Extract video files if present
    const videoFiles = extractVideoFiles(req);
    
    // Parse video metadata if present (for staff)
    let videoMetadata = null;
    if (req.body.videoMeta) {
      videoMetadata = JSON.parse(req.body.videoMeta);
    }
    
    // Parse video titles if present (for players)
    let videoTitles = null;
    if (req.body.videoTitles) {
      videoTitles = JSON.parse(req.body.videoTitles);
    }

    // Call service with all data
    const result = await UserServices.updateUserProfile({
      userId,
      data: profileData,
      profileImage,
      videoFiles,
      videoMetadata,
      videoTitles,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "User profile updated successfully",
      data: result,
    });
  } catch (error) {
    // Clean up uploaded video files on error
    const videoFiles = extractVideoFiles(req);
    await cleanupUploadedFiles(videoFiles);
    throw error;
  }
});

//update individual profile video
const updateProfileVideo = catchAsync(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const videoIndex = parseInt(req.params.videoIndex);

    if (isNaN(videoIndex) || videoIndex < 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid video index");
    }

    // Extract video file
    const videoFiles = extractVideoFiles(req);
    if (videoFiles.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Video file is required");
    }
    if (videoFiles.length > 1) {
      await cleanupUploadedFiles(videoFiles);
      throw new AppError(StatusCodes.BAD_REQUEST, "Only one video can be updated at a time");
    }

    // Parse metadata
    const videoTitle = req.body.videoTitle;
    const videoCategory = req.body.videoCategory; // For staff
    const position = req.body.position; // For staff

    const result = await UserServices.updateProfileVideo({
      userId,
      videoIndex,
      videoFile: videoFiles[0],
      videoTitle,
      videoCategory,
      position,
    });

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Video updated successfully",
      data: result,
    });
  } catch (error) {
    const videoFiles = extractVideoFiles(req);
    await cleanupUploadedFiles(videoFiles);
    throw error;
  }
});

//add new profile video
const addProfileVideo = catchAsync(async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Extract video file
    const videoFiles = extractVideoFiles(req);
    if (videoFiles.length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Video file is required");
    }
    if (videoFiles.length > 1) {
      await cleanupUploadedFiles(videoFiles);
      throw new AppError(StatusCodes.BAD_REQUEST, "Only one video can be added at a time");
    }

    // Parse metadata
    const videoTitle = req.body.videoTitle;
    const videoCategory = req.body.videoCategory; // For staff
    const position = req.body.position; // For staff

    const result = await UserServices.addProfileVideo({
      userId,
      videoFile: videoFiles[0],
      videoTitle,
      videoCategory,
      position,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: "Video added successfully",
      data: result,
    });
  } catch (error) {
    const videoFiles = extractVideoFiles(req);
    await cleanupUploadedFiles(videoFiles);
    throw error;
  }
});

//delete profile video
const deleteProfileVideo = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const videoIndex = parseInt(req.params.videoIndex);

  if (isNaN(videoIndex) || videoIndex < 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid video index");
  }

  const result = await UserServices.deleteProfileVideo({
    userId,
    videoIndex,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Video deleted successfully",
    data: result,
  });
});


export const UserController = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  addUserProfile,
  updateUserProfile,
  updateProfileVideo,
  addProfileVideo,
  deleteProfileVideo,
};
