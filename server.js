const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Cache for metadata to avoid hammering the stream server
let metadataCache = {
  data: null,
  timestamp: 0,
  cacheDuration: 10000 // 10 seconds
};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/config', (req, res) => {
  // Check for environment variable first
  if (process.env.STREAM_URL) {
    return res.json({ streamUrl: process.env.STREAM_URL });
  }

  // Fall back to reading from file
  const configPath = path.join(__dirname, 'stream_URL.txt');

  fs.readFile(configPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading stream_URL.txt:', err);
      return res.status(500).json({ error: 'Failed to read configuration' });
    }

    const streamUrl = data.trim();
    res.json({ streamUrl });
  });
});

app.get('/metadata', (req, res) => {
  // Check cache first
  const now = Date.now();
  if (metadataCache.data && (now - metadataCache.timestamp) < metadataCache.cacheDuration) {
    return res.json(metadataCache.data);
  }

  // Get stream URL
  const getStreamUrl = () => {
    return new Promise((resolve, reject) => {
      if (process.env.STREAM_URL) {
        return resolve(process.env.STREAM_URL);
      }

      const configPath = path.join(__dirname, 'stream_URL.txt');
      fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) return reject(err);
        resolve(data.trim());
      });
    });
  };

  getStreamUrl()
    .then(streamUrl => {
      // Parse URL
      const url = new URL(streamUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'GET',
        headers: {
          'Icy-MetaData': '1',
          'User-Agent': 'RadioCalico/1.0'
        }
      };

      const request = httpModule.request(options, (response) => {
        // Get metadata interval from headers
        const metaInt = parseInt(response.headers['icy-metaint']);

        if (!metaInt) {
          // No Icecast metadata available
          const fallbackData = {
            title: 'Radio Calico',
            artist: 'Live Stream',
            timestamp: now
          };
          metadataCache.data = fallbackData;
          metadataCache.timestamp = now;
          return res.json(fallbackData);
        }

        let buffer = Buffer.alloc(0);
        let dataReceived = 0;

        response.on('data', (chunk) => {
          buffer = Buffer.concat([buffer, chunk]);
          dataReceived += chunk.length;

          // We need at least one metadata block
          if (dataReceived >= metaInt + 1) {
            response.destroy(); // Close connection, we have what we need

            try {
              // Skip audio data, read metadata length
              const metaLength = buffer[metaInt] * 16;

              if (metaLength > 0) {
                const metaStart = metaInt + 1;
                const metaEnd = metaStart + metaLength;
                const metaString = buffer.slice(metaStart, metaEnd).toString('utf8').replace(/\0/g, '');

                // Parse StreamTitle='Artist - Title';
                const titleMatch = metaString.match(/StreamTitle='([^']+)'/);

                if (titleMatch && titleMatch[1]) {
                  const fullTitle = titleMatch[1];
                  let title = fullTitle;
                  let artist = '';

                  // Try to split "Artist - Title" format
                  if (fullTitle.includes(' - ')) {
                    const parts = fullTitle.split(' - ');
                    artist = parts[0].trim();
                    title = parts.slice(1).join(' - ').trim();
                  }

                  const metadata = {
                    title: title || 'Unknown Track',
                    artist: artist || '',
                    fullTitle: fullTitle,
                    timestamp: now
                  };

                  metadataCache.data = metadata;
                  metadataCache.timestamp = now;
                  return res.json(metadata);
                }
              }

              // No metadata found
              const fallbackData = {
                title: 'Radio Calico',
                artist: 'Live Stream',
                timestamp: now
              };
              metadataCache.data = fallbackData;
              metadataCache.timestamp = now;
              return res.json(fallbackData);

            } catch (error) {
              console.error('Error parsing metadata:', error);
              return res.status(500).json({ error: 'Failed to parse metadata' });
            }
          }
        });

        response.on('error', (error) => {
          console.error('Stream response error:', error);
          return res.status(500).json({ error: 'Stream error' });
        });
      });

      request.on('error', (error) => {
        console.error('Request error:', error);
        return res.status(500).json({ error: 'Failed to fetch metadata' });
      });

      request.setTimeout(5000, () => {
        request.destroy();
        return res.status(504).json({ error: 'Request timeout' });
      });

      request.end();
    })
    .catch(error => {
      console.error('Error getting stream URL:', error);
      return res.status(500).json({ error: 'Configuration error' });
    });
});

// Only start server if run directly (not when imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Radio player running at http://localhost:${PORT}`);
  });
}

// Export app for testing
module.exports = app;
