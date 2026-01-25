import { createLogger } from "winston";
import { consoleTransport, errorFileTransport, infoFileTransport, requestContext } from "./transport";
import config from "../../config";

// Use console and file transports in all environments
const transports = config.node_env === "production" 
  ? [errorFileTransport, infoFileTransport]
  : [consoleTransport, errorFileTransport, infoFileTransport];

export const logger = createLogger({
  transports,
  exitOnError: false
});

// Helper function to log with a specific requestId (for non-HTTP contexts)
export const logWithRequestId = (requestId: string, level: string, message: string, meta?: any) => {
  requestContext.run({ requestId }, () => {
    (logger as any)[level](message, meta);
  });
};

