#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { App } from "./components/App";
const argv = await yargs(hideBin(process.argv))
  .help()
  .alias("help", "h")
  .parse();

// Only run the UI if no command was provided
if (argv._.length === 0 && !argv.url) {
  // Enable alternate screen buffer
  process.stdout.write("\x1b[?1049h");

  const { waitUntilExit } = render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
    { exitOnCtrlC: true, patchConsole: false }
  );

  // Restore original screen when app exits
  waitUntilExit().then(() => {
    process.stdout.write("\x1b[?1049l");
  });
}
