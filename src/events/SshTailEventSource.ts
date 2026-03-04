import { spawn, ChildProcess } from "child_process";
import { EventSource, StatusType } from "./EventSource.js";

export class SshTailEventSource implements EventSource {
  private userAtHost: string;
  private remotePath: string;
  private replay: boolean;
  private sshArgs: string[];
  private proc: ChildProcess | null = null;
  private stopped = false;
  private onLine!: (line: string) => void;
  private onStatus!: (s: StatusType) => void;
  private buffer: string = "";
  private stderrCount = 0;
  private lastStderrTs = 0;

  constructor(userAtHost: string, remotePath: string, replay = false, sshArgs: string[] = []) {
    this.userAtHost = userAtHost;
    this.remotePath = remotePath;
    this.replay = replay;
    this.sshArgs = sshArgs;
  }

  start(onLine: (line: string) => void, onStatus: (s: StatusType) => void): void {
    this.onLine = onLine;
    this.onStatus = onStatus;
    this.connect();
  }

  private connect(): void {
    if (this.stopped) return;
    this.onStatus("CONNECTING");
    this.buffer = "";

    const tailCmd = this.replay
      ? `tail -n +1 -F ${this.remotePath}`
      : `tail -n 0 -F ${this.remotePath}`;

    const args = [
      ...this.sshArgs,
      this.userAtHost,
      tailCmd,
    ];

    this.proc = spawn("ssh", args, { stdio: ["ignore", "pipe", "pipe"] });

    this.proc.stdout!.setEncoding("utf8");
    this.proc.stdout!.on("data", (chunk: string) => {
      this.buffer += chunk;
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          this.onStatus("WATCHING");
          this.onLine(trimmed);
        }
      }
    });

    this.proc.stderr!.setEncoding("utf8");
    this.proc.stderr!.on("data", (chunk: string) => {
      const now = Date.now();
      // Rate-limit stderr surfacing (max once per 3s)
      if (now - this.lastStderrTs > 3000) {
        this.lastStderrTs = now;
        const msg = chunk.trim().slice(0, 200);
        // Surface as a fake event line so EventFeed can show it
        this.onLine(`__stderr__:${msg}`);
      }
    });

    this.proc.on("exit", () => {
      if (!this.stopped) {
        this.onStatus("DISCONNECTED");
      }
    });

    this.proc.on("error", () => {
      if (!this.stopped) {
        this.onStatus("DISCONNECTED");
      }
    });

    this.onStatus("WATCHING");
  }

  reconnect(): void {
    if (this.proc) {
      try { this.proc.kill(); } catch {}
      this.proc = null;
    }
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.proc) {
      try { this.proc.kill(); } catch {}
      this.proc = null;
    }
  }
}
