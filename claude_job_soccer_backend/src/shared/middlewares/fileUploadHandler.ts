import { Request, Response, NextFunction } from "express";
import fs from "fs";
import { StatusCodes } from "http-status-codes";
import multer, { FileFilterCallback } from "multer";
import path from "path";
import sharp from "sharp";
import newFileName from "../util/filenameGenerator";
import AppError from "../../errors/AppError";
const fileUploadHandler = (req: Request, res: Response, next: NextFunction) => {
  // Create upload folder
  const baseUploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir);
  }

  // Folder create for different file
  const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  };

  // Create filename
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      console.log(file.fieldname);
      switch (file.fieldname) {
        case "image":
        case "banner":
          uploadDir = path.join(baseUploadDir, "images");
          break;
        case "media":
          uploadDir = path.join(baseUploadDir, "medias");
          break;
        case "doc":
        case "docs":
          uploadDir = path.join(baseUploadDir, "docs");
          break;
        case "videos":
          uploadDir = path.join(baseUploadDir, "videos");
          break;
        default:
          throw new AppError(StatusCodes.BAD_REQUEST, "File is not supported");
      }
      createDir(uploadDir);
      cb(null, uploadDir);
    },

    filename: (_req, file, cb) => {
      let fileExt: string;
      if (file.fieldname === "doc" || file.fieldname === "docs") {
        fileExt = ".pdf";
      } else if (file.fieldname === "image" || file.fieldname === "banner") {
        fileExt = ".tmp"; // will be converted to .webp later
      } else if (file.fieldname === "videos") {
        // Retain original video extension
        fileExt = path.extname(file.originalname);
      } else {
        // For media, retain the original extension
        fileExt = path.extname(file.originalname);
      }
      //generate new filename using utility function
      const fileName = newFileName(file, path);

      cb(null, fileName + fileExt);
    },
  });

  // File filter
  const filterFilter = (_req: Request, file: any, cb: FileFilterCallback) => {
    if (file.fieldname === "image" || file.fieldname === "banner") {
      if (
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpg" ||
        file.mimetype === "image/heif" ||
        file.mimetype === "image/heic" ||
        file.mimetype === "image/tiff" ||
        file.mimetype === "image/webp" ||
        file.mimetype === "image/avif"
      ) {
        cb(null, true);
      } else {
        console.log(file.fieldname);
        console.log(file.mimetype);
        cb(
          new AppError(
            StatusCodes.BAD_REQUEST,
            "Only .jpeg, .png, .jpg, .heif, .heic, .tiff, .webp, .avif files supported"
          )
        );
      }
    } else if (file.fieldname === "media") {
      if (file.mimetype === "video/mp4" || file.mimetype === "audio/mpeg") {
        cb(null, true);
      } else {
        cb(
          new AppError(
            StatusCodes.BAD_REQUEST,
            "Only .mp4, .mp3, file supported"
          )
        );
      }
    } else if (file.fieldname === "doc" || file.fieldname === "docs") {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new AppError(StatusCodes.BAD_REQUEST, "Only pdf supported"));
      }
    } else if (file.fieldname === "videos") {
      const allowedMimeTypes = [
        "video/mp4",
        "video/quicktime", // .mov
        "video/x-msvideo", // .avi
        "video/webm",
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new AppError(
            StatusCodes.BAD_REQUEST,
            "Only .mp4, .mov, .avi, .webm video files supported"
          )
        );
      }
    } else {
      throw new AppError(StatusCodes.BAD_REQUEST, "This file is not supported");
    }
  };

  // Return multer middleware
  const upload = multer({
    storage: storage,
    fileFilter: filterFilter,
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max per file
    },
  }).fields([
    { name: "image", maxCount: 10 },
    { name: "banner", maxCount: 1 },
    { name: "media", maxCount: 10 },
    { name: "doc", maxCount: 10 },
    { name: "docs", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]);
  // Execute the multer middleware
  upload(req, res, async (err: any) => {
    if (err) {
      return next(err);
    }

    if (req.files && "image" in req.files) {
      const imageFiles = (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      )["image"];
      try {
        await Promise.all(
          imageFiles.map(async (file) => {
            const inputFilePath = file.path;
            const newFilePath = inputFilePath.replace(/\.tmp$/, ".webp");

            try {
              const sharpInstance = sharp(inputFilePath);
              const metadata = await sharpInstance.metadata();

              const pipeline =
                (metadata.width ?? 0) > 1024
                  ? sharp(inputFilePath).resize({ width: 1024 })
                  : sharp(inputFilePath);

              // Convert to WebP with optimized settings
              await pipeline
                .webp({
                  quality: 40,
                  effort: 2,
                  nearLossless: false,
                })
                .toFile(newFilePath);

              // Delete temporary file asynchronously
              await fs.promises.unlink(inputFilePath);

              // Update file metadata for downstream middlewares
              file.path = newFilePath;
              file.filename = path.basename(newFilePath);
            } catch (fileError) {
              // Clean up on individual file error
              if (fs.existsSync(inputFilePath)) {
                await fs.promises.unlink(inputFilePath);
              }
              throw fileError;
            }
          })
        );
      } catch (error) {
        return next(
          new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Image processing failed"
          )
        );
      }
    }

    // Process banner images
    if (req.files && "banner" in req.files) {
      const bannerFiles = (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      )["banner"];
      try {
        await Promise.all(
          bannerFiles.map(async (file) => {
            const inputFilePath = file.path;
            const newFilePath = inputFilePath.replace(/\.tmp$/, ".webp");

            try {
              const sharpInstance = sharp(inputFilePath);
              const metadata = await sharpInstance.metadata();

              const pipeline =
                (metadata.width ?? 0) > 1024
                  ? sharp(inputFilePath).resize({ width: 1024 })
                  : sharp(inputFilePath);

              // Convert to WebP with optimized settings
              await pipeline
                .webp({
                  quality: 40,
                  effort: 2,
                  nearLossless: false,
                })
                .toFile(newFilePath);

              // Delete temporary file asynchronously
              await fs.promises.unlink(inputFilePath);

              // Update file metadata for downstream middlewares
              file.path = newFilePath;
              file.filename = path.basename(newFilePath);
            } catch (fileError) {
              // Clean up on individual file error
              if (fs.existsSync(inputFilePath)) {
                await fs.promises.unlink(inputFilePath);
              }
              throw fileError;
            }
          })
        );
      } catch (error) {
        return next(
          new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Banner image processing failed"
          )
        );
      }
    }

    next();
  });
};

export default fileUploadHandler;
