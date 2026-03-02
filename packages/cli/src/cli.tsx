#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { App } from "./components/App";
import { resolve } from "path";

const argv = await yargs(hideBin(process.argv))
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

          if (url.pathname === "/watch") {
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
