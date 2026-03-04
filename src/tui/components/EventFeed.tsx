import React from "react";
import { Box, Text } from "ink";
import { formatHms, formatNum } from "../../core/time.js";

interface FeedEntry {
  ts: string;
  total_tokens: number;
  provider: string;
  model: string;
}

interface EventFeedProps {
  events: FeedEntry[];
  parseWarnings: number;
  stderrLines: string[];
  noColor: boolean;
  showPaths: boolean;
  paths: Record<string, string>;
}

export function EventFeed({ events, parseWarnings, stderrLines, noColor, showPaths, paths }: EventFeedProps) {
  const last10 = events.slice(-10).reverse();

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={noColor ? undefined : "gray"} paddingX={1}>
      <Text bold color={noColor ? undefined : "cyan"}>── Recent Events ───────────────────────────────────────────</Text>

      {showPaths && (
        <Box flexDirection="column" marginBottom={1}>
          {Object.entries(paths).map(([k, v]) => (
            <Box key={k}>
              <Text dimColor>{k}: </Text>
              <Text color={noColor ? undefined : "gray"}>{v}</Text>
            </Box>
          ))}
        </Box>
      )}

      {stderrLines.slice(-3).map((line, i) => (
        <Box key={`err-${i}`}>
          <Text color={noColor ? undefined : "red"}>[SSH] </Text>
          <Text dimColor>{line}</Text>
        </Box>
      ))}

      {last10.length === 0 && (
        <Text dimColor>Waiting for events…</Text>
      )}

      {last10.map((e, i) => (
        <Box key={i}>
          <Text color={noColor ? undefined : "gray"}>{formatHms(e.ts)}  </Text>
          <Text bold color={noColor ? undefined : "green"}>+{formatNum(e.total_tokens)}</Text>
          <Text>  </Text>
          <Text dimColor>{e.provider}/{e.model.slice(0, 30)}</Text>
        </Box>
      ))}

      {parseWarnings > 0 && (
        <Box marginTop={1}>
          <Text color={noColor ? undefined : "yellow"}>⚠ {parseWarnings} parse warning{parseWarnings !== 1 ? "s" : ""}</Text>
        </Box>
      )}
    </Box>
  );
}
