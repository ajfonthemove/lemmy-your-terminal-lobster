import { UsageEvent } from "./schema.js";
import { getLocalYmd } from "./time.js";

export interface LemmyState {
  rawLifetimeTokens: number;
  bonusXp: number;
  todayTokens: number;
  lastDayYmd: string;
  sessionTokens: number;
  moltCount: number;
  growthMultiplier: number;
  lastEventTs: string | null;
  recentEvents: Array<{ ts: string; total_tokens: number; provider: string; model: string }>;
  parseWarnings: number;
}

export const DEFAULT_STATE: LemmyState = {
  rawLifetimeTokens: 0,
  bonusXp: 0,
  todayTokens: 0,
  lastDayYmd: getLocalYmd(),
  sessionTokens: 0,
  moltCount: 0,
  growthMultiplier: 1.0,
  lastEventTs: null,
  recentEvents: [],
  parseWarnings: 0,
};

export const MOLT_THRESHOLD = 250_000;

export interface StageInfo {
  name: string;
  minTokens: number;
}

export const STAGES: StageInfo[] = [
  { name: "Hatchling", minTokens: 0 },
  { name: "Dock Pup", minTokens: 10_000 },
  { name: "Crate Hauler", minTokens: 50_000 },
  { name: "Wharf Boss", minTokens: 250_000 },
  { name: "Deep-Sea Legend", minTokens: 1_000_000 },
  { name: "Trench Lord", minTokens: 10_000_000 },
  { name: "Abyssal Titan", minTokens: 50_000_000 },
  { name: "Leviathan", minTokens: 250_000_000 },
  { name: "Elder Kraken", minTokens: 1_000_000_000 },
];

export function getStage(rawLifetimeTokens: number): StageInfo {
  let stage = STAGES[0];
  for (const s of STAGES) {
    if (rawLifetimeTokens >= s.minTokens) stage = s;
    else break;
  }
  return stage;
}

export function getStageIndex(rawLifetimeTokens: number): number {
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (rawLifetimeTokens >= STAGES[i].minTokens) idx = i;
    else break;
  }
  return idx;
}

export function getLevel(effectiveXp: number): number {
  return Math.floor(Math.pow(effectiveXp / 5000, 0.6)) + 1;
}

export function isReadyToMolt(state: LemmyState): boolean {
  return state.rawLifetimeTokens >= (state.moltCount + 1) * MOLT_THRESHOLD;
}

/** Returns {nextState, molted} */
export function applyEvent(
  state: LemmyState,
  event: UsageEvent,
  now: Date = new Date()
): { nextState: LemmyState; molted: boolean } {
  const todayYmd = getLocalYmd();
  let todayTokens = state.todayTokens;
  let lastDayYmd = state.lastDayYmd;

  // Day rollover
  if (lastDayYmd !== todayYmd) {
    todayTokens = 0;
    lastDayYmd = todayYmd;
  }

  const tokens = event.total_tokens;
  const rawLifetimeTokens = state.rawLifetimeTokens + tokens;
  const bonusXp = state.bonusXp + tokens * (state.growthMultiplier - 1);
  const sessionTokens = state.sessionTokens + tokens;
  todayTokens += tokens;

  // Keep last 50 events
  const recentEvents = [
    ...state.recentEvents,
    { ts: event.ts, total_tokens: tokens, provider: event.provider, model: event.model },
  ].slice(-50);

  let moltCount = state.moltCount;
  let growthMultiplier = state.growthMultiplier;
  const molted = rawLifetimeTokens >= (moltCount + 1) * MOLT_THRESHOLD;
  if (molted) {
    moltCount += 1;
    growthMultiplier = +(growthMultiplier * 1.05).toFixed(6);
  }

  return {
    nextState: {
      ...state,
      rawLifetimeTokens,
      bonusXp,
      todayTokens,
      lastDayYmd,
      sessionTokens,
      moltCount,
      growthMultiplier,
      lastEventTs: event.ts,
      recentEvents,
      // parseWarnings inherited unchanged
    },
    molted,
  };
}

export function stageProgress(rawLifetimeTokens: number): { pct: number; nextStage: StageInfo | null } {
  const idx = getStageIndex(rawLifetimeTokens);
  const current = STAGES[idx];
  const next = STAGES[idx + 1] ?? null;
  if (!next) return { pct: 100, nextStage: null };
  const pct = Math.min(100, Math.round(((rawLifetimeTokens - current.minTokens) / (next.minTokens - current.minTokens)) * 100));
  return { pct, nextStage: next };
}

export function moltProgress(state: LemmyState): number {
  const threshold = (state.moltCount + 1) * MOLT_THRESHOLD;
  const base = state.moltCount * MOLT_THRESHOLD;
  const pct = Math.min(100, Math.round(((state.rawLifetimeTokens - base) / (threshold - base)) * 100));
  return pct;
}
