import fs from "fs";
import path from "path";
import { EventSource, StatusType } from "./EventSource.js";
import { DEFAULT_USAGE_PATH } from "../core/paths.js";

export class LocalFileEventSource implements EventSource {
  private filePath: string;
  private replay: boolean;
  private offset: number = 0;
  private watcher: fs.FSWatcher | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private stopped = false;
  private onLine!: (line: string) => void;
  private onStatus!: (s: StatusType) => void;
  private lastSize: number = 0;
  private buffer: string = "";

  constructor(filePath?: string, replay = false) {
    this.filePath = filePath ?? DEFAULT_USAGE_PATH;
    this.replay = replay;
  }

  start(onLine: (line: string) => void, onStatus: (s: StatusType) => void): void {
    this.onLine = onLine;
    this.onStatus = onStatus;

    // Ensure file exists
    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "");
      }
    } catch {}

    // Determine start offset
    if (this.replay) {
      this.offset = 0;
    } else {
      try {
        const stat = fs.statSync(this.filePath);
        this.offset = stat.size;
        this.lastSize = stat.size;
      } catch {
        this.offset = 0;
        this.lastSize = 0;
      }
    }

    onStatus("WATCHING");
    this.scheduleRead();
    this.startWatcher();
  }

  stop(): void {
    this.stopped = true;
    if (this.watcher) { try { this.watcher.close(); } catch {} this.watcher = null; }
    if (this.pollTimer) { clearTimeout(this.pollTimer); this.pollTimer = null; }
  }

  private startWatcher(): void {
    try {
      this.watcher = fs.watch(this.filePath, () => {
        if (!this.stopped) this.readNewLines();
      });
      this.watcher.on("error", () => {
        // Fall back to polling
        if (this.watcher) { try { this.watcher.close(); } catch {} this.watcher = null; }
      });
    } catch {
      // fs.watch unavailable — polling only
    }
  }

  private scheduleRead(): void {
    if (this.stopped) return;
    this.pollTimer = setTimeout(() => {
      this.readNewLines();
      this.scheduleRead();
    }, 250);
  }

  private readNewLines(): void {
    if (this.stopped) return;
    try {
      const stat = fs.statSync(this.filePath);
      const currentSize = stat.size;

      // Handle truncation
      if (currentSize < this.lastSize) {
        this.offset = 0;
        this.buffer = "";
      }
      this.lastSize = currentSize;

      if (currentSize <= this.offset) return;

      const stream = fs.createReadStream(this.filePath, {
        start: this.offset,
        end: currentSize - 1,
        encoding: "utf8",
      });

      let chunk = "";
      stream.on("data", (data: string | Buffer) => {
        chunk += typeof data === "string" ? data : data.toString("utf8");
      });
      stream.on("end", () => {
        this.offset = currentSize;
        this.buffer += chunk;
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) this.onLine(trimmed);
        }
      });
      stream.on("error", () => {});
    } catch {}
  }
}
