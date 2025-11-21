import path from "path";
import { format, transports } from "winston";
const { combine, timestamp, label, printf, json } = format;
import "winston-daily-rotate-file";
import { ElasticsearchTransport } from "winston-elasticsearch";
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

export const elasticTransport = new ElasticsearchTransport({
  level: process.env.NODE_ENV === "production" ? "error" : "debug", // Only errors in production
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    auth: {
      username: process.env.ELASTICSEARCH_USER || "",
      password: process.env.ELASTICSEARCH_PASSWORD || "",
    },
  },
  indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || "log-express",
  indexSuffixPattern: "YYYY-MM-DD",
  handleRejections: false,
  handleExceptions: false,
  buffering: true,
  bufferLimit: 100,
  flushInterval: 2000, // Flush every 2 seconds
  format: combine(addRequestId),
  // Disable warnings to prevent spam
  ensureMappingTemplate: false,
});

// Silently handle Elasticsearch errors in development
elasticTransport.on("error", (error) => {
  if (process.env.NODE_ENV === "production") {
    console.error("Elasticsearch transport error:", error);
  }
  // Silently fail in development
});

elasticTransport.on("warning", (warning) => {});

export const errorFileTransport = fileTransport(
  "error",
  "logs/error/%DATE%-error.log"
);
export const infoFileTransport = fileTransport(
  "info",
  "logs/success/%DATE%-success.log"
);
