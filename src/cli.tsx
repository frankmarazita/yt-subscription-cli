#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { App } from "./components/App.js";

// Enable alternate screen buffer
process.stdout.write('\x1b[?1049h');

const { waitUntilExit } = render(<App />, {
  exitOnCtrlC: true,
  patchConsole: false
});

// Restore original screen when app exits
waitUntilExit().then(() => {
  process.stdout.write('\x1b[?1049l');
});
