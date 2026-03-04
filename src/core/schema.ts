import { z } from "zod";

export const UsageEventSchema = z.object({
  ts: z.string(),
  source: z.string(),
  provider: z.string(),
  model: z.string(),
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_read_tokens: z.number(),
  cache_write_tokens: z.number(),
  total_tokens: z.number(),
  session_key: z.string().nullable().optional(),
  session_id: z.string().nullable().optional(),
  run_id: z.string().nullable().optional(),
  agent_id: z.string().nullable().optional(),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

export function parseEvent(line: string): UsageEvent | null {
  try {
    const raw = JSON.parse(line.trim());
    const result = UsageEventSchema.safeParse(raw);
    if (result.success) return result.data;
    return null;
  } catch {
    return null;
  }
}
