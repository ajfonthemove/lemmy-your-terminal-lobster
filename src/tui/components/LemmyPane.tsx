import React, { useEffect, useState } from "react";
import { Box, Text } from "ink";
import { getSpriteFrames } from "../sprites.js";
import { getStage, getLevel } from "../../core/model.js";
import { LemmyState } from "../../core/model.js";

interface LemmyPaneProps {
  state: LemmyState;
  noColor: boolean;
  moltBanner: boolean;
}

export function LemmyPane({ state, noColor, moltBanner }: LemmyPaneProps) {
  const [frame, setFrame] = useState(0);
  const stage = getStage(state.rawLifetimeTokens);
  const frames = getSpriteFrames(stage.name);
  const effectiveXp = state.rawLifetimeTokens + state.bonusXp;
  const level = getLevel(effectiveXp);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 600);
    return () => clearInterval(timer);
  }, [frames.length]);

  const spriteLines = frames[frame] ?? frames[0];
  const spriteColor = noColor ? undefined : "red";

  return (
    <Box flexDirection="column" paddingX={1} minWidth={22}>
      {moltBanner && (
        <Box borderStyle="double" borderColor={noColor ? undefined : "yellow"}>
          <Text bold color={noColor ? undefined : "yellow"}>✨ MOLT COMPLETE +5% ✨</Text>
        </Box>
      )}
      <Box flexDirection="column" alignItems="center">
        {spriteLines.map((line, i) => (
          <Text key={i} color={spriteColor}>{line}</Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="column" alignItems="center">
        <Text bold color={noColor ? undefined : "magenta"}>{stage.name}</Text>
        <Text color={noColor ? undefined : "yellow"}>Level {level}</Text>
      </Box>
    </Box>
  );
}
