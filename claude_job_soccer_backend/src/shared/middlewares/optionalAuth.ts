import { NextFunction, Request, Response } from "express";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { jwtHelper } from "../util/jwtHelper";
import { logger } from "../logger/logger";

/**
 * Optional authentication middleware
 * Attempts to authenticate user if token is provided
 * If no token or invalid token, continues without setting req.user
 * This allows semi-private behavior where:
 * - Unauthenticated users get all data
 * - Authenticated users get filtered data based on their interactions
 */
const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenWithBearer = req.headers.authorization;

    // If no authorization header, continue without authentication
    if (!tokenWithBearer) {
      return next();
    }

    // If authorization header is present, try to authenticate
    if (tokenWithBearer && tokenWithBearer.startsWith("Bearer")) {
      const token = tokenWithBearer.split(" ")[1];

      try {
        // Verify token
        const verifyUser = jwtHelper.verifyToken(
          token,
          config.jwt.jwt_secret as Secret
        );

        // Set user to request object if valid
        req.user = verifyUser as typeof req.user;
        
        logger.info(`Optional auth: User ${verifyUser.id} authenticated`);
      } catch (error) {
        // Invalid token - log but don't throw error
        logger.warn("Optional auth: Invalid token provided, continuing as unauthenticated");
      }
    }

    next();
  } catch (error) {
    // Any unexpected errors - continue without authentication
    logger.error("Optional auth: Unexpected error", error);
    next();
  }
};

export default optionalAuth;
