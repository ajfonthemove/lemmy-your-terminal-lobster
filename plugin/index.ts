/**
 * lemmy-feed — OpenClaw plugin
 * Appends one NDJSON line per LLM completion to ~/.openclaw/logs/lemmy-usage.jsonl
 */

import fs from "fs";
import path from "path";
import os from "os";

const LOG_DIR = path.join(os.homedir(), ".openclaw", "logs");
const LOG_FILE = path.join(LOG_DIR, "lemmy-usage.jsonl");

// Ensure log directory exists once at startup
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch {
  // ignore
}

export default function register(api: any) {
  api.on("llm_output", (event: any, ctx: any) => {
    try {
      const usage = event?.usage;
      if (!usage) return; // skip if no usage data

      const input_tokens = usage.input ?? 0;
      const output_tokens = usage.output ?? 0;
      const cache_read_tokens = usage.cacheRead ?? 0;
      const cache_write_tokens = usage.cacheWrite ?? 0;
      const total_tokens =
        usage.total ?? (input_tokens + output_tokens + cache_read_tokens + cache_write_tokens);

      const record = {
        ts: new Date().toISOString(),
        source: "openclaw",
        provider: String(event.provider ?? "unknown"),
        model: String(event.model ?? event.modelId ?? "unknown"),
        input_tokens,
        output_tokens,
        cache_read_tokens,
        cache_write_tokens,
        total_tokens,
        session_key: ctx?.sessionKey ?? null,
        session_id: ctx?.sessionId ?? event.sessionId ?? null,
        run_id: event.runId ?? null,
        agent_id: ctx?.agentId ?? null,
      };

      const line = JSON.stringify(record);

      // Guard: keep each line < 4KB
      if (line.length > 4096) return;

      // Append fire-and-forget
      fs.appendFile(LOG_FILE, line + "\n", (err) => {
        if (err) {
          // Best-effort: retry mkdir then append
          fs.mkdirSync(LOG_DIR, { recursive: true });
          fs.appendFile(LOG_FILE, line + "\n", () => {});
        }
      });
    } catch {
      // Never crash the host process
    }
  });
}
