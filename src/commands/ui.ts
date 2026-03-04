import React from "react";
import { render } from "ink";
import { App } from "../tui/App.js";
import { LocalFileEventSource } from "../events/LocalFileEventSource.js";
import { loadState } from "../core/storage.js";
import { DEFAULT_USAGE_PATH } from "../core/paths.js";

interface UiOptions {
  path?: string;
  noColor?: boolean;
  replay?: boolean;
}

export async function cmdUi(opts: UiOptions = {}): Promise<void> {
  const filePath = opts.path ?? DEFAULT_USAGE_PATH;
  const state = loadState();
  const source = new LocalFileEventSource(filePath, opts.replay ?? false);

  const { waitUntilExit } = render(
    React.createElement(App, {
      source,
      initialState: state,
      mode: "LOCAL",
      filePath,
      noColor: opts.noColor ?? false,
      isSsh: false,
    }),
    { exitOnCtrlC: true }
  );

  await waitUntilExit();
}
