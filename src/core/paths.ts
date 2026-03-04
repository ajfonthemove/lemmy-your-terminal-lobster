import path from "path";
import os from "os";

export const HOME = os.homedir();
export const LEMMY_DIR = path.join(HOME, ".lemmy");
export const STATE_FILE = path.join(LEMMY_DIR, "state.json");
export const CONFIG_FILE = path.join(LEMMY_DIR, "config.json");
export const DEFAULT_USAGE_PATH = path.join(HOME, ".openclaw", "logs", "lemmy-usage.jsonl");
