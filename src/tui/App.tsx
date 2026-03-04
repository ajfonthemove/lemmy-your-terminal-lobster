import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useApp, useInput, useStdout } from "ink";
import { Header } from "./components/Header.js";
import { LemmyPane } from "./components/LemmyPane.js";
import { StatsPane } from "./components/StatsPane.js";
import { EventFeed } from "./components/EventFeed.js";
import { Footer } from "./components/Footer.js";
import { EventSource, StatusType } from "../events/EventSource.js";
import { SshTailEventSource } from "../events/SshTailEventSource.js";
import { parseEvent } from "../core/schema.js";
import { LemmyState, applyEvent, isReadyToMolt } from "../core/model.js";
import { saveState } from "../core/storage.js";
import { DEFAULT_USAGE_PATH, STATE_FILE, CONFIG_FILE, LEMMY_DIR } from "../core/paths.js";

interface AppProps {
  source: EventSource;
  initialState: LemmyState;
  mode: string;
  filePath: string;
  noColor: boolean;
  isSsh: boolean;
}

export function App({ source, initialState, mode, filePath, noColor, isSsh }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const [state, setState] = useState<LemmyState>({ ...initialState, sessionTokens: 0 });
  const [status, setStatus] = useState<StatusType>("WATCHING");
  const [moltBanner, setMoltBanner] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPaths, setShowPaths] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [stderrLines, setStderrLines] = useState<string[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleLine = useCallback((line: string) => {
    // Handle SSH stderr passthrough
    if (line.startsWith("__stderr__:")) {
      const msg = line.slice("__stderr__:".length);
      setStderrLines((prev) => [...prev.slice(-20), msg]);
      return;
    }

    const event = parseEvent(line);
    if (!event) {
      setState((prev) => {
        const next = { ...prev, parseWarnings: prev.parseWarnings + 1 };
        return next;
      });
      return;
    }

    setState((prev) => {
      const { nextState, molted } = applyEvent(prev, event);
      // Save periodically (fire and forget)
      setImmediate(() => saveState(nextState));
      if (molted) {
        setMoltBanner(true);
        setTimeout(() => setMoltBanner(false), 3000);
      }
      return nextState;
    });
  }, []);

  const handleStatus = useCallback((s: StatusType) => {
    setStatus(s);
  }, []);

  useEffect(() => {
    source.start(handleLine, handleStatus);
    return () => source.stop();
  }, [source]);

  useInput((input, key) => {
    if (confirmReset) {
      if (input === "y" || input === "Y") {
        setState((prev) => {
          const next = { ...prev, sessionTokens: 0 };
          saveState(next);
          return next;
        });
        setConfirmReset(false);
      } else {
        setConfirmReset(false);
      }
      return;
    }

    if (showHelp) {
      setShowHelp(false);
      return;
    }

    if (input === "q" || input === "Q") {
      saveState(stateRef.current);
      exit();
      return;
    }

    if (input === "m") {
      if (isReadyToMolt(stateRef.current)) {
        setState((prev) => {
          const next = {
            ...prev,
            moltCount: prev.moltCount + 1,
            growthMultiplier: +(prev.growthMultiplier * 1.05).toFixed(6),
          };
          saveState(next);
          setMoltBanner(true);
          setTimeout(() => setMoltBanner(false), 3000);
          return next;
        });
      }
      return;
    }

    if (input === "r") {
      setConfirmReset(true);
      return;
    }

    if (input === "?") {
      setShowHelp(true);
      return;
    }

    if (input === "c") {
      setShowPaths((p) => !p);
      return;
    }

    if (input === "R" && isSsh) {
      const sshSource = source as SshTailEventSource;
      if (typeof sshSource.reconnect === "function") {
        sshSource.reconnect();
      }
      return;
    }
  });

  const paths = {
    "Usage file": filePath,
    "State":      STATE_FILE,
    "Config":     CONFIG_FILE,
    "Base dir":   LEMMY_DIR,
  };

  if (showHelp) {
    return (
      <Box flexDirection="column" padding={2} borderStyle="double" borderColor={noColor ? undefined : "cyan"}>
        <Text bold color={noColor ? undefined : "cyan"}>🦞 Lemmy Help</Text>
        <Text> </Text>
        <Text><Text bold>[q]</Text>  Quit Lemmy</Text>
        <Text><Text bold>[m]</Text>  Molt (prestige) — when READY</Text>
        <Text><Text bold>[r]</Text>  Reset session tokens (confirm y)</Text>
        <Text><Text bold>[?]</Text>  Toggle this help overlay</Text>
        <Text><Text bold>[c]</Text>  Show/hide file paths in event feed</Text>
        {isSsh && <Text><Text bold>[R]</Text>  Reconnect SSH stream</Text>}
        <Text> </Text>
        <Text dimColor>Press any key to close</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Header mode={mode} status={status} filePath={filePath} noColor={noColor} />

      <Box flexDirection="row" marginTop={1}>
        <LemmyPane state={state} noColor={noColor} moltBanner={moltBanner} />
        <Box marginLeft={2}>
          <StatsPane state={state} noColor={noColor} />
        </Box>
      </Box>

      <Box marginTop={1}>
        <EventFeed
          events={state.recentEvents}
          parseWarnings={state.parseWarnings}
          stderrLines={stderrLines}
          noColor={noColor}
          showPaths={showPaths}
          paths={paths}
        />
      </Box>

      {confirmReset && (
        <Box borderStyle="single" borderColor={noColor ? undefined : "yellow"} paddingX={1}>
          <Text color={noColor ? undefined : "yellow"}>Reset session tokens? [y/n] </Text>
        </Box>
      )}

      <Footer isSsh={isSsh} noColor={noColor} />
    </Box>
  );
}
