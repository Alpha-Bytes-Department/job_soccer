import express, { Router } from "express";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.dto";
import validateRequest from "../../shared/middlewares/validateRequest";
import auth from "../../shared/middlewares/auth";
import { UserType } from "../user/user.interface";

const router = express.Router();

// Signup route
router.post(
  "/signup",
  validateRequest(AuthValidation.createUserDto),
  AuthController.createUser
);

// Login route
router.post(
  "/login",
  validateRequest(AuthValidation.loginUserDto),
  AuthController.loginUser
);

// Verify email route
router.post(
  "/verify-email",
  validateRequest(AuthValidation.verifyEmailDto),
  AuthController.verifyEmail
);

// Forgot password route
router.post(
  "/forgot-password",
  validateRequest(AuthValidation.forgetPasswordDto),
  AuthController.forgetPassword
);

// Reset password route
router.post(
  "/reset-password",
  validateRequest(AuthValidation.resetPasswordDto),
  AuthController.resetPassword
);

// Change password route (requires authentication)
router.post(
  "/change-password",
  auth(),
  validateRequest(AuthValidation.changePasswordDto),
  AuthController.changePassword
);

// Resend OTP route
router.post(
  "/resend-otp",
  validateRequest(AuthValidation.resendOtpDto),
  AuthController.resendOtp
);

// Delete account route (requires authentication)
router.delete(
  "/delete-account",
  auth(),
  AuthController.deleteAccount
);

export const AuthRoutes: Router = router;
