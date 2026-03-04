export type StatusType = "WATCHING" | "DISCONNECTED" | "CONNECTING" | "REPLAYING";

export interface EventSource {
  start(onLine: (line: string) => void, onStatus: (s: StatusType) => void): void;
  stop(): void;
}
