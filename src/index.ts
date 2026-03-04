#!/usr/bin/env node
/**
 * lemmy — terminal pet lobster CLI
 * Usage:
 *   lemmy                     — local UI (tail new events)
 *   lemmy --path <file>       — local UI, custom path
 *   lemmy --replay            — local UI, replay from beginning
 *   lemmy ssh <user@host>     — SSH stream mode
 *   lemmy add <tokens>        — append synthetic event
 *   lemmy replay              — replay mode
 *   lemmy doctor              — diagnostics
 */

import { cmdUi } from "./commands/ui.js";
import { cmdSsh } from "./commands/ssh.js";
import { cmdAdd } from "./commands/add.js";
import { cmdReplay } from "./commands/replay.js";
import { cmdDoctor } from "./commands/doctor.js";

async function main() {
  const args = process.argv.slice(2);

  // Flags
  const noColor = args.includes("--no-color");
  const replayFlag = args.includes("--replay");
  const pathIdx = args.indexOf("--path");
  const customPath = pathIdx !== -1 ? args[pathIdx + 1] : undefined;

  // Remove flags for subcommand detection
  const positional = args.filter((a) => !a.startsWith("-") || a === "--path");
  // Re-filter: remove --path and its value
  const subArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--path") { i++; continue; }
    if (args[i] === "--no-color") continue;
    if (args[i] === "--replay") continue;
    subArgs.push(args[i]);
  }

  const subcommand = subArgs[0];

  if (!subcommand || subcommand === "ui") {
    // Default: local UI
    await cmdUi({ path: customPath, noColor, replay: replayFlag });
    return;
  }

  if (subcommand === "ssh") {
    const userAtHost = subArgs[1];
    if (!userAtHost) {
      console.error("Usage: lemmy ssh <user@host> [--path <remote>] [--replay] [--ssh-args '<args>']");
      process.exit(1);
    }
    const sshArgsIdx = args.indexOf("--ssh-args");
    const sshArgs = sshArgsIdx !== -1 ? args[sshArgsIdx + 1] : undefined;
    await cmdSsh(userAtHost, { path: customPath, replay: replayFlag, sshArgs, noColor });
    return;
  }

  if (subcommand === "add") {
    const tokensStr = subArgs[1];
    if (!tokensStr || isNaN(Number(tokensStr))) {
      console.error("Usage: lemmy add <number>");
      process.exit(1);
    }
    await cmdAdd(Number(tokensStr), customPath);
    return;
  }

  if (subcommand === "replay") {
    await cmdReplay({ path: customPath, noColor });
    return;
  }

  if (subcommand === "doctor") {
    await cmdDoctor();
    return;
  }

  console.error(`Unknown command: ${subcommand}`);
  console.error("Commands: ssh, add, replay, doctor");
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
