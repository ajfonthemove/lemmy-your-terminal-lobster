import React from "react";
import { render } from "ink";
import { App } from "../tui/App.js";
import { SshTailEventSource } from "../events/SshTailEventSource.js";
import { loadState } from "../core/storage.js";

interface SshOptions {
  path?: string;
  replay?: boolean;
  sshArgs?: string;
  noColor?: boolean;
}

const DEFAULT_REMOTE_PATH = "~/.openclaw/logs/lemmy-usage.jsonl";

export async function cmdSsh(userAtHost: string, opts: SshOptions = {}): Promise<void> {
  const remotePath = opts.path ?? DEFAULT_REMOTE_PATH;
  const state = loadState();

  // Split --ssh-args safely
  const extraArgs = opts.sshArgs
    ? opts.sshArgs.trim().split(/\s+/).filter(Boolean)
    : [];

  const source = new SshTailEventSource(userAtHost, remotePath, opts.replay ?? false, extraArgs);

  const { waitUntilExit } = render(
    React.createElement(App, {
      source,
      initialState: state,
      mode: `SSH ${userAtHost}`,
      filePath: `${userAtHost}:${remotePath}`,
      noColor: opts.noColor ?? false,
      isSsh: true,
    }),
    { exitOnCtrlC: true }
  );

  await waitUntilExit();
}
