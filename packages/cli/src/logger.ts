import { writeFileSync } from "fs";
import { ensureConfigDir } from "./utils/config";
import { join } from "path";

function error(message: string) {
  const logFilePath = join(ensureConfigDir(), "error.log");

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    writeFileSync(logFilePath, logMessage, { flag: "a" });
  } catch (err) {
    console.error("Failed to write error log:", err);
  }
}

function info(message: string) {
  const logFilePath = join(ensureConfigDir(), "info.log");

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;

  try {
    writeFileSync(logFilePath, logMessage, { flag: "a" });
  } catch (err) {
    console.error("Failed to write info log:", err);
  }
}

export const logger = {
  error,
  info,
};
