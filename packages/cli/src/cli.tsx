#!/usr/bin/env node
import { render } from "ink";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { App } from "./components/App";

process.stdout.write("\x1b[?1049h");

const { waitUntilExit } = render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  { exitOnCtrlC: true, patchConsole: false }
);

waitUntilExit().then(() => {
  process.stdout.write("\x1b[?1049l");
});
