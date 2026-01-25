import path from "path";
import { format, transports } from "winston";
const { combine, timestamp, label, printf, json } = format;
import "winston-daily-rotate-file";
import { AsyncLocalStorage } from "async_hooks";

// Create async local storage for request context
export const requestContext = new AsyncLocalStorage<{ requestId: string }>();

// Custom format to add requestId from async context or metadata
const addRequestId = format((info) => {
  // Try to get requestId from async local storage first
  const context = requestContext.getStore();
  if (context?.requestId) {
    info.requestId = context.requestId;
  }
  // If not in async context, keep existing requestId from metadata
  return info;
})();

const myFormat = printf(({ level, message, label, timestamp, ...metadata }) => {
  const date = new Date(timestamp as string);
  const hour = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  
  // Ensure message is a string - handle objects, errors, etc.
  let formattedMessage: string;
  if (typeof message === 'string') {
    formattedMessage = message;
  } else if (message instanceof Error) {
    formattedMessage = message.message;
  } else if (typeof message === 'object' && message !== null) {
    formattedMessage = JSON.stringify(message);
  } else {
    formattedMessage = String(message);
  }
  
  const meta = Object.keys(metadata).length ? JSON.stringify(metadata) : "";
  return `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${formattedMessage} ${meta}`;
});

const fileTransport = (level: string, fileName: string) => {
  return new transports.DailyRotateFile({
    level: level,
    filename: path.resolve(__dirname, "..", "..", "..", "..", fileName),
    datePattern: "YYYY-MM-DD", // Daily rotation
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: combine(
      label({ label: "Job Soccer" }),
      timestamp(),
      addRequestId,
      json()
    ),
  });
};

export const consoleTransport = new transports.Console({
  level: "info",
  format: combine(
    label({ label: "Job Soccer" }),
    timestamp(),
    addRequestId,
    myFormat
  ),
});

export const errorFileTransport = fileTransport(
  "error",
  "logs/error/%DATE%-error.log"
);
export const infoFileTransport = fileTransport(
  "info",
  "logs/success/%DATE%-success.log"
);
