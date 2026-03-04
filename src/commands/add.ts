import fs from "fs";
import path from "path";
import os from "os";
import { DEFAULT_USAGE_PATH } from "../core/paths.js";

export async function cmdAdd(tokens: number, filePath?: string): Promise<void> {
  const target = filePath ?? DEFAULT_USAGE_PATH;

  // Ensure directory exists
  fs.mkdirSync(path.dirname(target), { recursive: true });

  const record = {
    ts: new Date().toISOString(),
    source: "manual",
    provider: "manual",
    model: "manual",
    input_tokens: tokens,
    output_tokens: 0,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
    total_tokens: tokens,
    session_key: null,
    session_id: null,
    run_id: null,
    agent_id: null,
  };

  const line = JSON.stringify(record) + "\n";
  fs.appendFileSync(target, line);
  console.log(`✅ Appended ${tokens} tokens to ${target}`);
}
