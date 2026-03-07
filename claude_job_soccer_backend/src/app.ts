import cors from "cors";
import express, { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import router from "./routes";
import cookieParser from "cookie-parser";
import compression from "compression";
import globalErrorHandler from "./shared/middlewares/globalErrorHandler";
import rateLimiter from "./shared/util/ratelimiter";
import { requestIdMiddleware } from "./shared/middlewares/requestIdAdder";
// import { helmetConfig } from "./shared/middlewares/security";
import winstonLogger from "./shared/logger/winstonExpressLogger";
// import { logger } from "./shared/logger/logger";
import { stripeWebhook } from "./modules/subscription/subscription.webhook";

const app: express.Application = express();

app.set("trust proxy", 1); // Trust first proxy (nginx)
//middlewares
// app.use(helmetConfig);

// CORS configuration - Allow all origins in development, specific origins in production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      "http://localhost:3000",
      "http://10.10.12.125:3000",
      "http://10.10.12.125:3001",
      "http://localhost:3001",
    ];
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    
    // In production, check against whitelist
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
};

app.use(cors(corsOptions));

app.use(
  compression({
    threshold: 1024,
    level: 6,
  })
);
// Request ID middleware - For tracking requests
app.use(requestIdMiddleware);
app.use(rateLimiter);

app.post(
  "/api/v1/subscription/stripe",
  express.raw({ type: "application/json", limit: "10mb" }),
  stripeWebhook
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

//express-winston - only error logging in production
app.use(winstonLogger.errorLogger);
// Info logger only in development
if (process.env.NODE_ENV !== "production") {
  app.use(winstonLogger.infoLogger);
}

//file retrieval - Static files with CORS headers
app.use("/images", cors(corsOptions), express.static("uploads/images"));
app.use("/videos", cors(corsOptions), express.static("uploads/videos"));
app.use("/docs", cors(corsOptions), express.static("uploads/docs"));
app.use(express.static("uploads"));
app.get("/health", (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

//router
app.use("/api/v1", router);

//live response
app.get("/", (_req: Request, res: Response) => {
  res.send(
    ` <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f3ff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="text-align: center; padding: 2rem 3rem; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);">
      <h1 style="font-size: 2.5rem; color: #7C3AED; margin-bottom: 1rem;">Welcome👋</h1>
      <p style="font-size: 1.2rem; color: #555;">I'm here to help you. How can I assist today?</p>
      <div style="margin-top: 2rem;">
        <p style="color: #777;">Want to see more projects or contact me?</p>
        <a href="https://github.com/abdullahalkafi-dev" target="_blank" style="text-decoration: none; color: #fff; background-color: #6D28D9; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: bold; display: inline-block; transition: background 0.3s;">
          Visit My GitHub 🚀
        </a>
      </div>
    </div>
  </div>`
  );
});

//global error handle
app.use(globalErrorHandler);

//handle not found route;
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    errorSources: [
      {
        path: req.originalUrl,
        message: "API DOESN'T EXIST",
      },
    ],
  });
});

export default app;
