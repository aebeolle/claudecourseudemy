# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Radio Calico is a web-based MP3 radio streaming player for Radio Calico (radio-calico.com). The application consists of a lightweight Express.js backend and a feature-rich single-page frontend.

**Stream Type**: MP3 320kbps live radio (not HLS, despite some README references)
**Stream URL**: https://radio3.radio-calico.com:8443/calico.mp3

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm start

# Build and run with Docker
docker build -t radiocalico .
docker run -p 3000:3000 radiocalico

# Run with custom configuration
docker run -p 3000:3000 -e STREAM_URL="<url>" -e PORT=3000 radiocalico
```

## Architecture

### Backend (server.js)

The Express server provides three main endpoints:

1. **`GET /`** - Serves the main HTML player
2. **`GET /config`** - Returns stream URL configuration
   - Priority: `STREAM_URL` env var → `stream_URL.txt` file
3. **`GET /metadata`** - Fetches live track metadata from Icecast stream
   - Implements 10-second caching to avoid hammering the stream server
   - Connects to stream with `Icy-MetaData: 1` header
   - Parses binary ICY metadata blocks to extract `StreamTitle`
   - Returns JSON: `{title, artist, fullTitle, timestamp}`

**Metadata Parsing Flow:**
- Reads stream until first metadata interval (`icy-metaint` header)
- Extracts metadata length byte (position = metaInt)
- Reads metadata string (length = metaLength * 16 bytes)
- Parses `StreamTitle='Artist - Title'` format
- Splits on ` - ` to separate artist and title

### Frontend

Single-page application with separated structure. No build process required.

**Files:**
- `public/index.html` - HTML structure and content (~180 lines)
- `public/styles.css` - All styling and responsive design (~710 lines)
- `public/script.js` - All JavaScript functionality (~540 lines)

**Key Architecture Patterns:**

1. **Configuration Loading**: Fetches `/config` on page load, falls back to localStorage
2. **Metadata Polling**: Polls `/metadata` every 15 seconds when stream is active
3. **Album Art**: Uses iTunes Search API to fetch artwork based on artist + title
4. **Rating System**: localStorage-based persistent star ratings (key: `artist_title`.toLowerCase())

**Major Features:**
- Custom play/pause toggle button (SVG icons, no native controls)
- Volume slider with mute functionality
- Album art display (150x150px, fallback to 🎵 emoji)
- Track rating (5 stars, localStorage persistence)
- Song history (last 3 tracks)
- Real-time metadata updates
- Reconnect mechanism (10s buffering timeout)
- Collapsible debug panel and URL input

**Design System:**
- Font: Poppins (Google Fonts)
- Colors: Dark theme with green accents
  - Background: `#2a2a2a` (body), `#484848` (containers), `#626262` (controls)
  - Accent: `#d5efca` (headings, icons)
  - Secondary: `#4a9594` (buttons, links)
  - Text: `#f9f9fb` (primary), `#cbcbcb` (secondary), `#999` (tertiary)
- Layout: Full website structure (header, hero, player, info section, footer)
- Responsive breakpoints: 768px (tablet), 480px (mobile)

## Configuration Priority

Stream URL is determined in this order:
1. `STREAM_URL` environment variable
2. `stream_URL.txt` file in project root
3. User input via web interface (stored in localStorage as `radiocalico_last_url`)

## Important Implementation Details

### Metadata Update Flow
```
Client polls /metadata (15s) → Server checks cache →
If expired: Server connects to stream → Parse ICY metadata →
Extract StreamTitle → Split artist/title → Cache (10s) →
Return to client → Update UI + fetch album art
```

### Rating Storage Format
```javascript
// localStorage key: "trackRatings"
// Format: { "artist_title": rating }
// Example: { "death cab for cutie_stay young, go dancing": 4 }
```

### Album Art Loading
- Fetches from iTunes Search API: `https://itunes.apple.com/search?term={artist+title}&entity=song&limit=1`
- Upgrades artwork URL from 100x100 to 600x600 resolution
- Falls back to 🎵 emoji on error or no results

## Styling Conventions

- **Labels**: Uppercase, 0.8em, color `#999`, 0.5px letter-spacing
- **Buttons**:
  - Primary: `#4a9594` background, white text
  - Hover: `#3a7574` (darker teal)
  - Border-radius: 25px for standard buttons, 50% for icon buttons
- **SVG Icons**: 36px x 36px for player controls, `#d5efca` color
- **Cards/Sections**: `#484848` background, 15px border-radius, dark shadow

## Key Files

- `server.js` - Express backend with metadata parsing logic
- `public/index.html` - HTML structure and content
- `public/styles.css` - All CSS styling and responsive design
- `public/script.js` - All JavaScript functionality and event handlers
- `stream_URL.txt` - Default stream URL
- `.env.example` - Environment variable template
- `Dockerfile` - Container configuration for deployment

## Notes

- The frontend follows separation of concerns: HTML structure, CSS styling, and JavaScript functionality are in separate files
- The README mentions HLS support, but the application currently streams MP3 directly (no hls.js library is used)
- Audio element has `controls` attribute removed; all controls are custom-built
- Star rating hover effect shows temporary yellow color before committing rating
- History tracks are added when a new track starts (not when previous track ends)
- Debug panel and URL input sections are hidden by default, shown via toggle buttons
