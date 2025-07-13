#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { App } from "./components/App.js";

const argv = yargs(hideBin(process.argv))
  .scriptName("yt-sub")
  .help()
  .alias("help", "h")
  .parseSync();

// Interactive mode (with graceful fallback for development)
if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  console.log(
    "⚠️  Warning: Running in limited mode - some keyboard controls may not work"
  );
  console.log("💡 For full interactive experience, use a proper terminal\n");
}

render(<App />);
