import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { z } from "zod";

const AppConfigSchema = z.object({
  userPreferences: z.object({
    thumbnailPreview: z.boolean(),
    autoRefresh: z.boolean(),
  }),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const DEFAULT_CONFIG: AppConfig = {
  userPreferences: {
    thumbnailPreview: true,
    autoRefresh: true,
  },
};

export function getConfigDir(): string {
  return join(homedir(), ".config", "yt-subscription-cli");
}

export function getConfigPath(): string {
  return join(getConfigDir(), "config.json");
}

export function getDatabasePath(): string {
  return join(getConfigDir(), "app.db");
}

export function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

export function loadConfig(): AppConfig {
  ensureConfigDir();
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    // Create default config file
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const configData = readFileSync(configPath, "utf-8");
    const rawConfig = JSON.parse(configData);

    // Validate with Zod schema
    const validatedConfig = AppConfigSchema.parse(rawConfig);
    return validatedConfig;
  } catch (err) {
    console.warn("Failed to load/validate config, using defaults:", err);
    // If validation fails, save the default config to fix the file
    saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: AppConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save config:", err);
  }
}
