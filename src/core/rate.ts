/**
 * Compute tokens/min from last N events' timestamps.
 * Falls back to arrival time if event timestamps are unavailable.
 */
export function computeRate(recentEvents: Array<{ ts: string; total_tokens: number }>, windowSize = 25): number {
  const slice = recentEvents.slice(-windowSize);
  if (slice.length < 2) return 0;

  const times = slice.map((e) => new Date(e.ts).getTime());
  const tokens = slice.map((e) => e.total_tokens);

  const deltaMs = times[times.length - 1] - times[0];
  if (deltaMs <= 0) return 0;

  const totalTokens = tokens.reduce((a, b) => a + b, 0);
  const deltaMin = deltaMs / 60_000;
  return Math.round(totalTokens / deltaMin);
}
