import { z } from "zod";

// Role enums
export enum CandidateRole {
  PROFESSIONAL_PLAYER = "Professional Player",
  AMATEUR_PLAYER = "Amateur Player",
  HIGH_SCHOOL = "High School Player",
  COLLEGE_UNIVERSITY = "College/University Player",
  ON_FIELD_STAFF = "On field staff",
  OFFICE_STAFF = "Office Staff",
}

export enum EmployerRole {
  PROFESSIONAL_CLUB = "Professional Club",
  ACADEMY = "Academy",
  AMATEUR_CLUB = "Amateur Club",
  CONSULTING_COMPANY = "Consulting Company",
  HIGH_SCHOOL = "High School",
  COLLEGE_UNIVERSITY = "College/University",
  AGENT = "Agent",
}

// Combined role enum values for validation
const allRoles = [
  ...Object.values(CandidateRole),
  ...Object.values(EmployerRole),
] as [string, ...string[]];

// Signup validation schema
const createUserDto = z.object({
  body: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.email("Invalid email format")
      ,
      role: z.enum(allRoles, "Invalid role selected"),
      password: z.string().optional(),
      loginProvider: z.enum(["linkedin", "email"]),
      userType: z.enum(["candidate", "employer"]).optional(),
    })
    .strict(),
});

// Login validation schema
const loginUserDto = z.object({
  body: z
    .object({
      email: z.email("Invalid email format"),
      password: z.string().optional(),
      loginProvider: z.enum(["linkedin", "email"]),
      role: z.enum(allRoles, "Invalid role selected").optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      userType: z.enum(["candidate", "employer"]).optional(),
    })
    .strict(),
});

// Verify email validation schema
const verifyEmailDto = z.object({
  body: z
    .object({
      email: z.string().min(1, "Email is required").email("Invalid email format"),
      oneTimeCode: z.string().min(1, "OTP is required"),
      reason: z.enum(["account_verification", "password_reset"]).optional(),
    })
    .strict(),
});

// Forget password validation schema
const forgetPasswordDto = z.object({
  body: z
    .object({
      email: z.email("Invalid email format"),
    })
    .strict(),
});

// Reset password validation schema
const resetPasswordDto = z.object({
  body: z
    .object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict()
    
});

// Change password validation schema
const changePasswordDto = z.object({
  body: z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

// Resend OTP validation schema
const resendOtpDto = z.object({
  body: z
    .object({
      email: z.string().min(1, "Email is required").email("Invalid email format"),
      reason: z.enum(["account_verification", "password_reset"]),
    })
    .strict(),
});

export const AuthValidation = {
  createUserDto,
  loginUserDto,
  verifyEmailDto,
  forgetPasswordDto,
  resetPasswordDto,
  changePasswordDto,
  resendOtpDto,
};
