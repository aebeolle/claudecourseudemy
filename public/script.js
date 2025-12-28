const DEFAULT_STREAM_URL = 'https://radio3.radio-calico.com:8443/calico.mp3';
const STORAGE_KEY = 'radiocalico_last_url';
const BUFFERING_TIMEOUT = 10000; // 10 seconds

const audio = document.getElementById('audioPlayer');
const statusDiv = document.getElementById('status');
const loadBtn = document.getElementById('loadBtn');
const reconnectBtn = document.getElementById('reconnectBtn');
const debugToggleBtn = document.getElementById('debugToggleBtn');
const urlToggleBtn = document.getElementById('urlToggleBtn');
const urlInputContainer = document.getElementById('urlInputContainer');
const urlInput = document.getElementById('urlInput');
const debugPanel = document.getElementById('debugPanel');
const debugContent = document.getElementById('debugContent');
const liveBadge = document.getElementById('liveBadge');
const nowPlayingInfo = document.getElementById('nowPlayingInfo');
const songHistory = document.getElementById('songHistory');
const albumArt = document.getElementById('albumArt');
const playPauseButton = document.getElementById('playPauseButton');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const volumeSlider2 = document.getElementById('volumeSlider2');
const volumeButton = document.getElementById('volumeButton');

let bufferingTimer = null;
let currentStreamUrl = '';
let songHistoryData = [];
let currentTrack = null;
let trackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');

function getTimestamp() {
    return new Date().toLocaleTimeString();
}

function addDebugEntry(message, isError = false) {
    const entry = document.createElement('div');
    entry.className = 'debug-entry' + (isError ? ' error' : '');
    entry.innerHTML = `
        <span class="debug-timestamp">[${getTimestamp()}]</span> ${message}
    `;
    debugContent.appendChild(entry);
    // Only scroll if panel is already visible
    if (debugPanel.classList.contains('visible')) {
        debugPanel.scrollTop = debugPanel.scrollHeight;
    }
}

function updateStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
    addDebugEntry(message, type === 'error');
}

function loadLastUsedUrl() {
    const lastUrl = localStorage.getItem(STORAGE_KEY);
    return lastUrl || DEFAULT_STREAM_URL;
}

function saveUrl(url) {
    localStorage.setItem(STORAGE_KEY, url);
}

function clearBufferingTimer() {
    if (bufferingTimer) {
        clearTimeout(bufferingTimer);
        bufferingTimer = null;
    }
}

function startBufferingTimer() {
    clearBufferingTimer();
    bufferingTimer = setTimeout(() => {
        addDebugEntry('Buffering timeout exceeded 10 seconds', true);
        updateStatus('Connection timeout - click Reconnect', 'error');
        showReconnectButton();
    }, BUFFERING_TIMEOUT);
}

function showReconnectButton() {
    reconnectBtn.classList.add('visible');
}

function hideReconnectButton() {
    reconnectBtn.classList.remove('visible');
}

function showLiveBadge() {
    liveBadge.classList.add('visible');
}

function hideLiveBadge() {
    liveBadge.classList.remove('visible');
}

function reconnect() {
    addDebugEntry('Manual reconnect initiated');
    hideReconnectButton();
    if (currentStreamUrl) {
        loadStream(currentStreamUrl);
    }
}

function updateAlbumArt(artist, title) {
    // Reset to default music icon
    albumArt.innerHTML = '🎵';

    if (!artist && !title) return;

    // Build search term
    const searchTerm = `${artist || ''} ${title || ''}`.trim();
    if (!searchTerm) return;

    // Use iTunes Search API to fetch album art
    const apiUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=1`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                const artworkUrl = data.results[0].artworkUrl100;
                // Get higher resolution artwork
                const highResArtwork = artworkUrl.replace('100x100', '600x600');

                // Create img element
                const img = document.createElement('img');
                img.src = highResArtwork;
                img.alt = 'Album Art';
                img.onerror = () => {
                    // If image fails to load, keep default icon
                    albumArt.innerHTML = '🎵';
                };

                // Replace content with image
                albumArt.innerHTML = '';
                albumArt.appendChild(img);

                addDebugEntry('Album art loaded');
            } else {
                addDebugEntry('No album art found for this track');
            }
        })
        .catch(err => {
            addDebugEntry(`Failed to fetch album art: ${err.message}`, true);
        });
}

function getTrackKey(artist, title) {
    return `${artist || 'Unknown'}_${title || 'Unknown'}`.toLowerCase();
}

function saveRating(artist, title, rating) {
    const key = getTrackKey(artist, title);
    trackRatings[key] = rating;
    localStorage.setItem('trackRatings', JSON.stringify(trackRatings));
    addDebugEntry(`Rated track ${rating} stars`);
}

function loadRating(artist, title) {
    const key = getTrackKey(artist, title);
    return trackRatings[key] || 0;
}

function updateStarDisplay(rating) {
    const stars = document.querySelectorAll('.star');
    const ratingText = document.getElementById('ratingText');

    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
        } else {
            star.classList.remove('filled');
        }
    });

    if (rating > 0) {
        ratingText.textContent = `${rating} star${rating !== 1 ? 's' : ''}`;
    } else {
        ratingText.textContent = 'Rate this track';
    }
}

function updateNowPlaying(title, artist) {
    const titleDiv = nowPlayingInfo.querySelector('.metadata-title');
    const artistDiv = nowPlayingInfo.querySelector('.metadata-artist');

    titleDiv.textContent = title || 'Unknown Track';
    artistDiv.textContent = artist || '-';

    // Fetch and update album art
    updateAlbumArt(artist, title);

    // Load and display rating for this track
    const rating = loadRating(artist, title);
    updateStarDisplay(rating);

    addDebugEntry(`Now Playing: ${title || 'Unknown'} ${artist ? '- ' + artist : ''}`);
}

function updateStreamStatus(status) {
    const streamStatus = document.getElementById('streamStatus');
    if (streamStatus) {
        streamStatus.textContent = status;
    }
}

function addToHistory(title, artist) {
    const track = {
        title: title || 'Unknown Track',
        artist: artist || '',
        time: new Date().toLocaleTimeString()
    };

    // Avoid duplicates - only add if different from last song
    if (songHistoryData.length === 0 ||
        songHistoryData[0].title !== track.title ||
        songHistoryData[0].artist !== track.artist) {

        songHistoryData.unshift(track);

        // Keep only last 3 songs
        if (songHistoryData.length > 3) {
            songHistoryData.pop();
        }

        updateHistoryDisplay();
        addDebugEntry(`Added to history: ${track.title}`);
    }
}

function updateHistoryDisplay() {
    if (songHistoryData.length === 0) {
        songHistory.innerHTML = '<div class="history-empty">No history yet</div>';
        return;
    }

    songHistory.innerHTML = songHistoryData.map(track => `
        <div class="history-item">
            <div class="history-item-title">${track.title}</div>
            ${track.artist ? `<div class="history-item-artist">${track.artist}</div>` : ''}
            <div class="history-item-time">${track.time}</div>
        </div>
    `).join('');
}

function handleMetadata(metadata) {
    // Extract title and artist from ID3 tags
    let title = null;
    let artist = null;

    if (metadata.TIT2) {
        title = metadata.TIT2;
    } else if (metadata.title) {
        title = metadata.title;
    }

    if (metadata.TPE1) {
        artist = metadata.TPE1;
    } else if (metadata.artist) {
        artist = metadata.artist;
    }

    // Some streams use combined format
    if (title && title.includes(' - ') && !artist) {
        const parts = title.split(' - ');
        artist = parts[0];
        title = parts[1];
    }

    if (title) {
        // Check if this is a new track
        if (!currentTrack || currentTrack.title !== title || currentTrack.artist !== artist) {
            // Add previous track to history if it exists
            if (currentTrack) {
                addToHistory(currentTrack.title, currentTrack.artist);
            }

            currentTrack = { title, artist };
            updateNowPlaying(title, artist);
        }
    }
}

function loadStream(streamUrl) {
    if (!streamUrl || !streamUrl.trim()) {
        updateStatus('Please enter a valid stream URL', 'error');
        return;
    }

    streamUrl = streamUrl.trim();
    currentStreamUrl = streamUrl;
    addDebugEntry(`Loading MP3 stream: ${streamUrl}`);
    updateStatus('Connecting to live radio stream...', 'loading');

    hideReconnectButton();
    showLiveBadge();
    audio.pause();
    audio.src = '';

    saveUrl(streamUrl);

    // Direct MP3 stream loading
    addDebugEntry('Using native audio for MP3 stream playback');
    audio.src = streamUrl;
    audio.load();

    // Auto-play for live radio
    audio.play().then(() => {
        updateStatus('Live radio streaming...', 'playing');
        addDebugEntry('Stream playing successfully');
        startMetadataPolling();
    }).catch(err => {
        updateStatus('Ready to play - click play button', 'loading');
        addDebugEntry(`Autoplay prevented: ${err.message}`, true);
        // Start polling even if autoplay fails
        startMetadataPolling();
    });
}

loadBtn.addEventListener('click', () => {
    loadStream(urlInput.value);
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loadStream(urlInput.value);
    }
});

reconnectBtn.addEventListener('click', () => {
    reconnect();
});

debugToggleBtn.addEventListener('click', () => {
    const isVisible = debugPanel.classList.contains('visible');
    if (isVisible) {
        debugPanel.classList.remove('visible');
        debugToggleBtn.textContent = 'Show Debug Log';
    } else {
        debugPanel.classList.add('visible');
        debugToggleBtn.textContent = 'Hide Debug Log';
    }
});

urlToggleBtn.addEventListener('click', () => {
    const isVisible = urlInputContainer.classList.contains('visible');
    if (isVisible) {
        urlInputContainer.classList.remove('visible');
        urlToggleBtn.textContent = 'Change Stream URL';
    } else {
        urlInputContainer.classList.add('visible');
        urlToggleBtn.textContent = 'Hide URL Input';
    }
});

// Custom Play/Pause toggle control
playPauseButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play().then(() => {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
            playPauseButton.title = 'Pause';
            addDebugEntry('Play button clicked');
        }).catch(err => {
            addDebugEntry(`Play error: ${err.message}`, true);
        });
    } else {
        audio.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playPauseButton.title = 'Play';
        addDebugEntry('Pause button clicked');
    }
});

// Volume controls
volumeSlider2.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
});

volumeButton.addEventListener('click', () => {
    if (audio.volume > 0) {
        audio.dataset.previousVolume = audio.volume;
        audio.volume = 0;
        volumeSlider2.value = 0;
        addDebugEntry('Muted');
    } else {
        const prevVol = parseFloat(audio.dataset.previousVolume) || 0.8;
        audio.volume = prevVol;
        volumeSlider2.value = prevVol * 100;
        addDebugEntry('Unmuted');
    }
});

// Star rating event listeners
const stars = document.querySelectorAll('.star');
stars.forEach(star => {
    // Click to rate
    star.addEventListener('click', () => {
        if (currentTrack && currentTrack.title) {
            const rating = parseInt(star.dataset.rating);
            saveRating(currentTrack.artist, currentTrack.title, rating);
            updateStarDisplay(rating);
        }
    });

    // Hover effect - show preview
    star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        stars.forEach((s, index) => {
            if (index < rating) {
                s.classList.add('hover');
            } else {
                s.classList.remove('hover');
            }
        });
    });
});

// Reset hover effect when leaving star container
document.getElementById('starRating').addEventListener('mouseleave', () => {
    stars.forEach(star => star.classList.remove('hover'));
});

// Initialize volume
audio.volume = 0.8;

audio.addEventListener('playing', () => {
    updateStatus('Playing...', 'playing');
    updateStreamStatus('🔴 Live Streaming');
    clearBufferingTimer();
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playPauseButton.title = 'Pause';
});

audio.addEventListener('pause', () => {
    if (!audio.ended) {
        updateStatus('Paused', 'loading');
        updateStreamStatus('⏸ Paused');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        playPauseButton.title = 'Play';
    }
});

audio.addEventListener('waiting', () => {
    updateStatus('Buffering...', 'loading');
    updateStreamStatus('⏳ Buffering...');
    addDebugEntry('Buffering...');
    startBufferingTimer();
});

audio.addEventListener('canplay', () => {
    addDebugEntry('Stream ready to play');
    updateStreamStatus('✓ Ready');
    clearBufferingTimer();
});

audio.addEventListener('error', (e) => {
    const errorMsg = audio.error ? `Audio error: ${audio.error.message} (code: ${audio.error.code})` : 'Audio error occurred';
    updateStatus(errorMsg, 'error');
    addDebugEntry(errorMsg, true);
});

// Prevent seeking for live MP3 stream
audio.addEventListener('seeking', (e) => {
    // For MP3 live streams, seeking is typically not meaningful
    // The stream is continuous and live
    addDebugEntry('Seek attempted on live stream');
});

// Metadata polling function
function fetchMetadata() {
    fetch('/metadata')
        .then(response => response.json())
        .then(data => {
            if (data.title) {
                // Check if this is a new track
                const newTitle = data.title;
                const newArtist = data.artist || '';

                if (!currentTrack || currentTrack.title !== newTitle || currentTrack.artist !== newArtist) {
                    // Add previous track to history if it exists
                    if (currentTrack && currentTrack.title !== 'Waiting for track info...') {
                        addToHistory(currentTrack.title, currentTrack.artist);
                    }

                    currentTrack = { title: newTitle, artist: newArtist };
                    updateNowPlaying(newTitle, newArtist);
                }
            }
        })
        .catch(err => {
            addDebugEntry(`Failed to fetch metadata: ${err.message}`, true);
        });
}

// Start metadata polling (every 15 seconds)
let metadataInterval = null;
function startMetadataPolling() {
    // Fetch immediately
    fetchMetadata();

    // Then poll every 15 seconds
    if (metadataInterval) {
        clearInterval(metadataInterval);
    }
    metadataInterval = setInterval(fetchMetadata, 15000);
    addDebugEntry('Metadata polling started (15s interval)');
}

function stopMetadataPolling() {
    if (metadataInterval) {
        clearInterval(metadataInterval);
        metadataInterval = null;
        addDebugEntry('Metadata polling stopped');
    }
}

// Initialize player
addDebugEntry('Player initialized');

// Fetch config from server
fetch('/config')
    .then(response => response.json())
    .then(data => {
        if (data.streamUrl) {
            urlInput.value = data.streamUrl;
            addDebugEntry(`Stream URL loaded from server config`);
            loadStream(data.streamUrl);
        } else {
            throw new Error('No stream URL in config');
        }
    })
    .catch(err => {
        addDebugEntry(`Failed to load config: ${err.message}`, true);
        // Fallback to localStorage
        const lastUrl = loadLastUsedUrl();
        urlInput.value = lastUrl;
        addDebugEntry(`Fallback to last used URL from storage`);
        loadStream(lastUrl);
    });