#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { App } from "./components/App";
import { addSubscriptionToCSV } from "./utils/subscriptionUtils";
import { resolve } from "path";

const argv = await yargs(hideBin(process.argv))
  .command(
    "add <url>",
    "Add a YouTube channel subscription from URL",
    (yargs) => {
      return yargs.positional("url", {
        describe: "YouTube channel URL",
        type: "string",
        demandOption: true,
      });
    },
    async (argv) => {
      try {
        const result = await addSubscriptionToCSV(argv.url);
        console.log("✅", result);
        process.exit(0);
      } catch (error) {
        console.error("❌", (error as Error).message);
        process.exit(1);
      }
    }
  )
  .command(
    "viewer",
    "Start web server for watching videos",
    (yargs) => {
      return yargs.option("port", {
        alias: "p",
        describe: "Port to run the server on",
        type: "number",
        default: 4000,
      });
    },
    async (argv) => {
      const watchHtmlPath = resolve(import.meta.dir, "../watch.html");

      Bun.serve({
        port: argv.port,
        async fetch(req) {
          const url = new URL(req.url);

          if (url.pathname === "/") {
            const file = Bun.file(watchHtmlPath);
            return new Response(file, {
              headers: {
                "Content-Type": "text/html",
              },
            });
          }

          return new Response("Not Found", { status: 404 });
        },
      });

      console.log(`🎬 Viewer server running at http://localhost:${argv.port}`);
    }
  )
  .help()
  .alias("help", "h")
  .parse();

// Only run the UI if no command was provided
if (argv._.length === 0 && !argv.url) {
  // Enable alternate screen buffer
  process.stdout.write("\x1b[?1049h");

  const { waitUntilExit } = render(<App />, {
    exitOnCtrlC: true,
    patchConsole: false,
  });

  // Restore original screen when app exits
  waitUntilExit().then(() => {
    process.stdout.write("\x1b[?1049l");
  });
}
