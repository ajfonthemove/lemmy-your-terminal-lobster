import React from "react";
import { Box, Text } from "ink";

interface FooterProps {
  isSsh: boolean;
  noColor: boolean;
}

export function Footer({ isSsh, noColor }: FooterProps) {
  const c = noColor ? undefined : "gray";
  return (
    <Box paddingX={1}>
      <Text color={c}>
        [q] quit  [m] molt  [r] reset session  [?] help  [c] paths
        {isSsh ? "  [R] reconnect" : ""}
      </Text>
    </Box>
  );
}
