import React from "react";
import { Box, Text } from "ink";
import {
  LemmyState,
  getLevel,
  isReadyToMolt,
  stageProgress,
  moltProgress,
  MOLT_THRESHOLD,
} from "../../core/model.js";
import { computeRate } from "../../core/rate.js";
import { formatNum } from "../../core/time.js";

function ProgressBar({ pct, width = 20, noColor }: { pct: number; width?: number; noColor: boolean }) {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return (
    <Text>
      <Text color={noColor ? undefined : "green"}>{"█".repeat(filled)}</Text>
      <Text dimColor>{"░".repeat(empty)}</Text>
      <Text> {pct}%</Text>
    </Text>
  );
}

interface StatsPaneProps {
  state: LemmyState;
  noColor: boolean;
}

export function StatsPane({ state, noColor }: StatsPaneProps) {
  const effectiveXp = state.rawLifetimeTokens + state.bonusXp;
  const level = getLevel(effectiveXp);
  const rate = computeRate(state.recentEvents);
  const readyToMolt = isReadyToMolt(state);
  const { pct: stagePct, nextStage } = stageProgress(state.rawLifetimeTokens);
  const moltPct = moltProgress(state);
  const threshold = (state.moltCount + 1) * MOLT_THRESHOLD;

  return (
    <Box flexDirection="column" paddingX={1} minWidth={35}>
      <Text bold color={noColor ? undefined : "cyan"}>── Stats ──────────────────</Text>

      <Box flexDirection="column" marginTop={1}>
        <Box>
          <Text dimColor>Session:  </Text>
          <Text bold color={noColor ? undefined : "white"}>{formatNum(state.sessionTokens)}</Text>
          <Text dimColor> tokens</Text>
        </Box>
        <Box>
          <Text dimColor>Today:    </Text>
          <Text bold color={noColor ? undefined : "white"}>{formatNum(state.todayTokens)}</Text>
          <Text dimColor> tokens</Text>
        </Box>
        <Box>
          <Text dimColor>Lifetime: </Text>
          <Text bold color={noColor ? undefined : "white"}>{formatNum(state.rawLifetimeTokens)}</Text>
          <Text dimColor> tokens</Text>
        </Box>
        <Box>
          <Text dimColor>Rate:     </Text>
          <Text bold color={noColor ? undefined : "green"}>{rate.toLocaleString()}</Text>
          <Text dimColor> tok/min</Text>
        </Box>
      </Box>

      <Text bold color={noColor ? undefined : "cyan"} >── Molt ────────────────────</Text>
      <Box flexDirection="column">
        <Box>
          <Text dimColor>Count:      </Text>
          <Text>{state.moltCount}</Text>
        </Box>
        <Box>
          <Text dimColor>Multiplier: </Text>
          <Text color={noColor ? undefined : "yellow"}>x{state.growthMultiplier.toFixed(2)}</Text>
        </Box>
        <Box>
          <Text dimColor>Progress:   </Text>
        </Box>
        <ProgressBar pct={moltPct} noColor={noColor} />
        {readyToMolt && (
          <Text bold color={noColor ? undefined : "yellow"}>⚡ READY — press [m] to molt!</Text>
        )}
        {!readyToMolt && (
          <Box>
            <Text dimColor>{formatNum(state.rawLifetimeTokens)} / {formatNum(threshold)}</Text>
          </Box>
        )}
      </Box>

      <Text bold color={noColor ? undefined : "cyan"}>── Stage ───────────────────</Text>
      <Box flexDirection="column">
        <ProgressBar pct={stagePct} noColor={noColor} />
        {nextStage ? (
          <Text dimColor>Next: {nextStage.name}</Text>
        ) : (
          <Text color={noColor ? undefined : "magenta"}>MAX STAGE</Text>
        )}
      </Box>
    </Box>
  );
}
