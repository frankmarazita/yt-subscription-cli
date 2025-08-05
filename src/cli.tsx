#!/usr/bin/env node
import { render } from "ink";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { App } from "./components/App.js";

render(<App />);
