import { cmdUi } from "./ui.js";

interface ReplayOptions {
  path?: string;
  noColor?: boolean;
}

export async function cmdReplay(opts: ReplayOptions = {}): Promise<void> {
  await cmdUi({ ...opts, replay: true });
}
