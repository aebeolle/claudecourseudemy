# Radio Calico - HLS Stream Player

A simple, elegant web-based radio player that supports HLS (HTTP Live Streaming) streams.

## Features

- Clean, modern UI with responsive design
- HLS stream support using hls.js
- Fallback to native HLS support for Safari
- Real-time status updates and debug panel
- Play/Pause controls with volume slider and mute
- Automatic reconnect mechanism (10s buffering timeout)
- Live stream badge indicator
- Custom URL input with localStorage persistence
- Server-side stream configuration
- Error handling and recovery

## Requirements

### Local Development
- Node.js (v12 or higher)
- npm

### Docker
- Docker

## Installation & Running

### Option 1: Local Development

1. Install dependencies:
```bash
npm install
```

2. (Optional) Configure stream URL:
```bash
cp .env.example .env
# Edit .env and set STREAM_URL
```

3. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

### Option 2: Docker

1. Build the Docker image:
```bash
docker build -t radiocalico .
```

2. Run with default configuration:
```bash
docker run -p 3000:3000 radiocalico
```

3. Run with custom stream URL:
```bash
docker run -p 3000:3000 -e STREAM_URL="https://your-stream-url.m3u8" radiocalico
```

4. Run with custom port:
```bash
docker run -p 8080:8080 -e PORT=8080 -e STREAM_URL="https://your-stream-url.m3u8" radiocalico
```

The application will be available at `http://localhost:3000` (or your custom port)

## Configuration

### Stream URL Priority

The application checks for stream URLs in this order:
1. `STREAM_URL` environment variable
2. `stream_URL.txt` file in project root
3. User input in the web interface

### Environment Variables

- `STREAM_URL`: HLS stream URL (.m3u8)
- `PORT`: Server port (default: 3000)

### Configuration Files

- `.env`: Environment variables (copy from `.env.example`)
- `stream_URL.txt`: Default stream URL (used if no env var is set)

## Project Structure

```
radiocalico/
├── server.js           # Express server with /config endpoint
├── package.json        # Dependencies and scripts
├── Dockerfile          # Docker configuration
├── .dockerignore       # Docker ignore file
├── .env.example        # Environment variables template
├── stream_URL.txt      # Default stream URL file
├── public/
│   └── index.html     # Radio player UI with all features
└── README.md          # This file
```

## How It Works

1. **Server**: Express.js server that:
   - Serves static files from the `public` directory
   - Provides `/config` endpoint that returns stream URL from env var or file

2. **Client**: Advanced HTML5 audio player with:
   - HLS.js integration for broad browser support
   - Automatic reconnect on buffering timeout (10s) or fatal errors
   - Volume control with mute/unmute
   - Live stream detection and badge display
   - Comprehensive debug panel with timestamped events
   - LocalStorage persistence for last used URL
   - Falls back to native HLS support for Safari/iOS

## Browser Support

- Chrome, Firefox, Edge: Uses hls.js
- Safari, iOS Safari: Uses native HLS support

## Player Features

### Reconnect Mechanism
- Automatically triggers reconnect button after 10 seconds of buffering
- Shows reconnect option on fatal HLS errors
- Manual reconnect button to reload stream

### Volume Controls
- Slider to adjust volume (0-100%)
- Mute/Unmute button
- Volume state preserved when toggling mute

### Live Badge
- Pulsing red "LIVE" badge appears for live streams
- Auto-detected from HLS manifest metadata
- Hidden for VOD content

### Debug Panel
- Timestamped event log
- HLS.js events (manifest parsed, fragments buffered, etc.)
- Error details with severity indication
- Auto-scrolling to latest entries

## Troubleshooting

If the stream doesn't play:
1. Check that the stream URL is valid and accessible
2. Verify the stream is in HLS format (.m3u8)
3. Check the debug panel for detailed error information
4. Ensure CORS is enabled on the stream server
5. Try the reconnect button if buffering persists

### Docker Issues

If the Docker container doesn't start:
1. Verify the image was built successfully
2. Check port 3000 is not already in use
3. Ensure environment variables are properly set
4. Check container logs: `docker logs <container-id>`

## License

ISC
