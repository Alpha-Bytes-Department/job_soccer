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


export const UserController = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserActivationStatus,
  updateUserRole,
  getMe,
  addUserProfile,
};
