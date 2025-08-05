# YouTube Subscription CLI

A terminal-based YouTube subscription manager built with React Ink. Browse your YouTube subscriptions directly from the command line with thumbnail previews.

## Features

- **Interactive terminal interface** for browsing YouTube subscriptions
- **Thumbnail previews** in supported terminals (iTerm2, Kitty, etc.)
- **Smart caching system** with SQLite for fast loading and offline access
- **Keyboard navigation** with vim-like controls
- **Auto-refresh functionality** with progress indicators
- **Video grouping** by date (Today, Yesterday, This Week, etc.)
- **YouTube Shorts detection** and filtering
- **Background thumbnail prefetching** for smooth navigation
- **Toggle thumbnail preview** on/off during use

## Installation

```bash
bun install
```

## Usage

### Start the CLI

```bash
bun start
```

### Development

```bash
bun run dev  # Run with file watching and hot reload
```

## Controls

- **↑/↓** or **j/k**: Navigate through videos
- **Enter** or **o**: Open selected video in browser
- **r**: Refresh data from YouTube RSS feeds
- **p**: Toggle thumbnail preview on/off
- **q** or **Esc**: Quit application

## Setup

1. Export your YouTube subscriptions:
   - Go to [Google Takeout](https://takeout.google.com)
   - Select YouTube and YouTube Music
   - Download and extract the data
   - Copy `subscriptions.csv` to the project root

2. The app will automatically create a cache database (`cache.db`) on first run

## Thumbnail Support

The app displays video thumbnails in terminals that support image protocols:
- **iTerm2** (macOS)
- **Kitty** (cross-platform)
- **Wezterm** (cross-platform)
- Other terminals with sixel or similar image support

In unsupported terminals, thumbnails appear as colored ASCII blocks.

## Tech Stack

- **Runtime**: Bun
- **UI**: React with Ink (terminal UI framework)
- **Database**: Bun's built-in SQLite
- **Image Display**: terminal-image
- **XML Parsing**: xml2js
- **Language**: TypeScript

## Architecture

The app uses a modular React component architecture:
- **Memoized components** to prevent unnecessary re-renders
- **Background thumbnail caching** with LRU eviction
- **Prefetching system** for smooth navigation
- **SQLite persistence** for offline access and performance
