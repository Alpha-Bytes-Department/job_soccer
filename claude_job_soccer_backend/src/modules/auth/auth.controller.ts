import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/util/catchAsync";
import sendResponse from "../../shared/util/sendResponse";
import { AuthService } from "./auth.service";

// Create user (signup)
const createUser = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  console.log("user data when signup ------------------>", userData);
  const result = await AuthService.createUser(userData);

  
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: "User created successfully",
    data: result,
  });
});

// Verify email
const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyData = req.body;
  const result = await AuthService.verifyEmailToDB(verifyData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: result.message,
    data: result.data,
  });
});

// Login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const loginData = req.body;
  console.log("user data when login ------------------>", loginData);

  const result = await AuthService.loginUser(loginData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User logged in successfully",
    data: result,
  });
});

// Forget password
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.forgetPasswordToDB(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Please check your email, we sent an OTP!",
    data: result,
  });
});

// Reset password
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  const resetData = req.body;
  const result = await AuthService.resetPasswordToDB(token!, resetData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password reset successfully",
    data: result,
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const passwordData = req.body;
  console.log("user", user);

  await AuthService.changePasswordToDB(user, passwordData);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password changed successfully",
  });
});

// Delete account
const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await AuthService.deleteAccountToDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Account deleted successfully",
    data: result,
  });
});

// Resend OTP
const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, reason } = req.body;
  const result = await AuthService.resendOtp({ email, reason });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Please check your email, we sent an OTP!",
    data: result,
  });
});

export const AuthController = {
  createUser,
  verifyEmail,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  deleteAccount,
  resendOtp,
};
