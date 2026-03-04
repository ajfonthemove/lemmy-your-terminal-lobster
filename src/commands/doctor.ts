import fs from "fs";
import { DEFAULT_USAGE_PATH, STATE_FILE, CONFIG_FILE, LEMMY_DIR } from "../core/paths.js";
import { parseEvent } from "../core/schema.js";

export async function cmdDoctor(): Promise<void> {
  console.log("🩺 Lemmy Doctor\n");
  console.log("Paths:");
  console.log(`  Base dir:   ${LEMMY_DIR}`);
  console.log(`  State:      ${STATE_FILE}`);
  console.log(`  Config:     ${CONFIG_FILE}`);
  console.log(`  Usage file: ${DEFAULT_USAGE_PATH}`);

  console.log("\nChecking usage file…");
  let lines: string[] = [];
  try {
    const content = fs.readFileSync(DEFAULT_USAGE_PATH, "utf8");
    lines = content.trim().split("\n").filter(Boolean);
    console.log(`  Total lines: ${lines.length}`);
  } catch (e: any) {
    console.log(`  ⚠ Could not read usage file: ${e.message}`);
  }

  const last5 = lines.slice(-5);
  if (last5.length > 0) {
    console.log(`\nValidating last ${last5.length} line(s):`);
    for (let i = 0; i < last5.length; i++) {
      const line = last5[i];
      const event = parseEvent(line);
      if (event) {
        console.log(`  Line ${lines.length - last5.length + i + 1}: ✅ valid — ${event.total_tokens} total_tokens (${event.provider}/${event.model})`);
      } else {
        console.log(`  Line ${lines.length - last5.length + i + 1}: ❌ INVALID — ${line.slice(0, 80)}`);
      }
    }
  }

  console.log("\nChecking state…");
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const state = JSON.parse(raw);
    console.log(`  rawLifetimeTokens: ${state.rawLifetimeTokens}`);
    console.log(`  moltCount:         ${state.moltCount}`);
    console.log(`  growthMultiplier:  ${state.growthMultiplier}`);
    console.log(`  todayTokens:       ${state.todayTokens}`);
    console.log(`  parseWarnings:     ${state.parseWarnings}`);
  } catch {
    console.log("  (no state file yet)");
  }

  console.log("\n✅ Doctor done.");
}
