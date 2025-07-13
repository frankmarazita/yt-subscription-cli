# YouTube Subscription CLI

A terminal-based YouTube subscription manager built with React Ink. Browse your YouTube subscriptions directly from the command line.

## Features

- Browse your YouTube subscriptions in an interactive terminal interface
- Cache system for fast loading
- Keyboard navigation
- Open videos directly in your default browser
- Auto-refresh functionality
- Detailed and simple view modes

## Installation

```bash
bun install
```

## Usage

### Start the CLI

```bash
npm start
```

### Command Line Options

```bash
npm start [options]

Options:
  --no-cache          Skip cache and fetch fresh data
  -l, --limit <n>     Only fetch first N channels
  --include-shorts    Include YouTube Shorts in results
  -v, --verbose       Use detailed multi-line format
  -h, --help          Show help
```

### Development

```bash
bun run dev  # Run with file watching
```

## Controls

- **↑/↓** or **j/k**: Navigate through videos
- **Enter**: Open selected video in browser
- **r**: Refresh data
- **q**: Quit application

## Requirements

- Node.js
- A YouTube subscription export file (`subscriptions.json`)
- Default browser configured for opening links

## Tech Stack

- **Runtime**: Bun
- **UI**: React with Ink (terminal UI)
- **Database**: SQLite (better-sqlite3)
- **CLI**: yargs
- **Language**: TypeScript
