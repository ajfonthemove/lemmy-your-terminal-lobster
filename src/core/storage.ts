import fs from "fs";
import path from "path";
import { LEMMY_DIR, STATE_FILE, CONFIG_FILE } from "./paths.js";
import { LemmyState, DEFAULT_STATE } from "./model.js";

export function ensureLemmyDir(): void {
  fs.mkdirSync(LEMMY_DIR, { recursive: true });
}

export function loadState(): LemmyState {
  ensureLemmyDir();
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle new fields
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: LemmyState): void {
  ensureLemmyDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export interface LemmyConfig {
  moltThreshold: number;
  noColor: boolean;
}

export const DEFAULT_CONFIG: LemmyConfig = {
  moltThreshold: 250_000,
  noColor: false,
};

export function loadConfig(): LemmyConfig {
  ensureLemmyDir();
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
