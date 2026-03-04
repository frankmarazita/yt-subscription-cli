#!/usr/bin/env node
import { render } from "ink";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { App } from "./components/App";
import { useConfigStore } from "./store/configStore";

function HostGate() {
  const hostVersion = useConfigStore((state) => state.hostVersion);
  return <App key={hostVersion} />;
}

process.stdout.write("\x1b[?1049h");
process.stdout.write("\x1b[?1000h"); // enable mouse tracking
process.stdout.write("\x1b[?1006h"); // enable SGR extended encoding

const { waitUntilExit } = render(
  <QueryClientProvider client={queryClient}>
    <HostGate />
  </QueryClientProvider>,
  { exitOnCtrlC: true, patchConsole: false }
);

waitUntilExit().then(() => {
  process.stdout.write("\x1b[?1006l");
  process.stdout.write("\x1b[?1000l");
  process.stdout.write("\x1b[?1049l");
});
