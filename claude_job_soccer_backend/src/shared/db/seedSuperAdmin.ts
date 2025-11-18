import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/AppError";
import { User } from "../../modules/user/user.model";
import { UserType } from "../../modules/user/user.interface";
import { Auth } from "../../modules/auth/auth.model";
import { LoginProvider } from "../../modules/auth/auth.interface";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { logger } from "../logger/logger";
import config from "../../config";

export type TSuperAdmin = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/**
 * Seed Super Admin on server startup
 * Creates a super admin if one doesn't exist
 */
export const seedSuperAdmin = async (): Promise<void> => {
  const session = await mongoose.startSession();

  try {
    // Get super admin credentials from environment variables or use defaults
    const superAdminData: TSuperAdmin = {
      firstName: config.super_admin?.firstName || "Super",
      lastName: config.super_admin?.lastName || "Admin",
      email: config.super_admin?.email || "superadmin@jobsoccer.com",
      password: config.super_admin?.password || "SuperAdmin@123",
    };
    // Check if super admin already exists
    const existingAdmin = await User.findOne({
      email: superAdminData.email,
      userType: UserType.ADMIN,
    });

    if (existingAdmin) {
      logger.info("✅ Super Admin already exists");
      return;
    }

    await session.withTransaction(async () => {
      // Check if auth with this email already exists
      const existingAuth = await Auth.findOne({
        email: superAdminData.email,
      }).session(session);

      if (existingAuth) {
        logger.warn(
          `⚠️  Auth record with email ${superAdminData.email} already exists but no admin user found`
        );
        return;
      }


      // Hash the password
      const hashedPassword = await bcrypt.hash(superAdminData.password, 12);

      // Create auth entry
      const authEntry = await Auth.create(
        [
          {
            email: superAdminData.email,
            password: hashedPassword,
            loginProvider: LoginProvider.EMAIL,
          },
        ],
        { session }
      );

      if (!authEntry[0]) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Super Admin auth creation failed"
        );
      }

      // Create super admin user
      const superAdmin = await User.create(
        [
          {
            firstName: superAdminData.firstName,
            lastName: superAdminData.lastName,
            email: superAdminData.email,
            userType: UserType.ADMIN,
            isVerified: true,
            authId: authEntry[0]._id,
          },
        ],
        { session }
      );

      if (!superAdmin[0]) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          "Super Admin user creation failed"
        );
      }

      logger.info("🎉 Super Admin created successfully");
      logger.info(`📧 Email: ${superAdminData.email}`);
      logger.info(`🔑 Password: ${superAdminData.password}`);
      logger.info("⚠️  Please change the password after first login");
    });
  } catch (error) {
    logger.error("❌ Failed to seed Super Admin:", error);
    throw error;
  } finally {
    await session.endSession();
  }
};
