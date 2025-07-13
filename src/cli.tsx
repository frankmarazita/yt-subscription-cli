#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { App } from './components/App.js';

const argv = yargs(hideBin(process.argv))
  .scriptName('yt-sub')
  .usage('$0 [options]')
  .option('no-cache', {
    type: 'boolean',
    description: 'Skip cache and fetch fresh data',
    default: false
  })
  .option('limit', {
    type: 'number',
    description: 'Only fetch first N channels',
    alias: 'l'
  })
  .option('include-shorts', {
    type: 'boolean',
    description: 'Include YouTube Shorts in results',
    default: false
  })
  .option('verbose', {
    type: 'boolean',
    description: 'Use detailed multi-line format',
    alias: 'v',
    default: false
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const appProps = {
  useCache: !argv['no-cache'],
  maxChannels: argv.limit,
  includeShorts: argv['include-shorts']
};

// Interactive mode (with graceful fallback for development)
if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.log('⚠️  Warning: Running in limited mode - some keyboard controls may not work');
  console.log('💡 For full interactive experience, use a proper terminal\n');
}

render(<App {...appProps} />);