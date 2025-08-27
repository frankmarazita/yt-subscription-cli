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
- **Watch Later playlist** with keyboard shortcuts
- **QR code modal** for easy mobile access to videos
- **Enhanced metadata** with view counts, like counts, and descriptions
- **Responsive terminal UI** that adapts to window resizing
- **Add subscriptions** from any YouTube channel URL format via command line

## Installation

```bash
bun install
```

## Usage

### Start the CLI

```bash
bun start
```

### Add a Subscription

Add any YouTube channel to your subscriptions using any URL format:

```bash
# Add from @username handle
bun src/cli.tsx add "https://www.youtube.com/@channelname"

# Add from /c/ format
bun src/cli.tsx add "https://www.youtube.com/c/channelname"

# Add from channel ID format
bun src/cli.tsx add "https://www.youtube.com/channel/UC..."

# Show help
bun src/cli.tsx add --help
```

### Development

```bash
bun run dev  # Run with file watching and hot reload
```

## Controls

- **↑/↓** or **j/k**: Navigate through videos
- **Page Up/Page Down**: Jump through list faster
- **Enter** or **o**: Open selected video in browser and mark as watched
- **w**: Toggle Watch Later status for current video
- **m**: Toggle watched status for current video (mark as watched/unwatched)
- **l**: Toggle Watch Later filter (show only starred videos)
- **s**: Show QR code modal for current video
- **r**: Refresh data from YouTube RSS feeds
- **p**: Toggle thumbnail preview on/off
- **q** or **Esc**: Quit application

## Setup

### Method 1: Google Takeout (Recommended)

1. Export your YouTube subscriptions:
   - Go to [Google Takeout](https://takeout.google.com)
   - Select YouTube and YouTube Music
   - Download and extract the data
   - Copy `subscriptions.csv` to the project root

### Method 2: Manual Addition

1. Create an empty `subscriptions.csv` or use the existing one
2. Add channels using the command line:
   ```bash
   bun src/cli.tsx add "https://www.youtube.com/@your-favorite-channel"
   ```

## Database

The app automatically creates a SQLite database at `~/.config/yt-subscription-cli/app.db` for:

- Video caching (faster loading, offline access)
- Watch Later playlist
- Watch history tracking

## Supported YouTube URL Formats

The `add` command supports all common YouTube channel URL formats:

- `https://www.youtube.com/@username` (handle format)
- `https://www.youtube.com/c/channelname` (custom URL format)
- `https://www.youtube.com/channel/UC...` (channel ID format)

The tool automatically:

- Extracts the channel ID from any format
- Fetches the channel title from YouTube
- Prevents duplicate subscriptions
- Creates the CSV file if it doesn't exist

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

## File Structure

- `subscriptions.csv` - Your YouTube channel subscriptions (CSV format from Google Takeout)
- `~/.config/yt-subscription-cli/app.db` - SQLite database for caching and playlists
- `~/.config/yt-subscription-cli/config.json` - User preferences and settings

## CSV Format

The `subscriptions.csv` file uses the Google Takeout format:

```csv
Channel ID,Channel URL,Channel title
UC...,https://www.youtube.com/channel/UC...,Channel Name
```

## Architecture

The app uses a modular React component architecture:

- **Memoized components** to prevent unnecessary re-renders
- **Background thumbnail caching** with LRU eviction
- **Prefetching system** for smooth navigation
- **SQLite persistence** for offline access and performance
- **Command line interface** with yargs for subscription management
