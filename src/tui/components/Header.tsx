import React from "react";
import { Box, Text } from "ink";
import { StatusType } from "../../events/EventSource.js";

interface HeaderProps {
  mode: string;
  status: StatusType;
  filePath: string;
  noColor: boolean;
}

export function Header({ mode, status, filePath, noColor }: HeaderProps) {
  const statusColor = status === "WATCHING" ? "green" : status === "CONNECTING" ? "yellow" : "red";

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={noColor ? undefined : "cyan"} paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color={noColor ? undefined : "cyan"}>🦞 Lemmy — your terminal lobster</Text>
        <Box>
          <Text dimColor>Mode: </Text>
          <Text bold color={noColor ? undefined : "magenta"}>{mode}</Text>
          <Text>  </Text>
          <Text dimColor>Status: </Text>
          <Text bold color={noColor ? undefined : statusColor}>{status}</Text>
        </Box>
      </Box>
      <Box>
        <Text dimColor>Path: </Text>
        <Text color={noColor ? undefined : "gray"}>{filePath}</Text>
      </Box>
    </Box>
  );
}
