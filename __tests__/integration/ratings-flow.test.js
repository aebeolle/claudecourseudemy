const { saveRating, loadRating, updateStarDisplay, getTrackKey } = require('../../public/script.js');

describe('Complete Rating Flow', () => {
  beforeEach(() => {
    // Set up minimal DOM needed for rating flow
    document.body.innerHTML = `
      <div class="star-rating" id="starRating">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <span class="rating-text" id="ratingText">Rate this track</span>
    `;

    // Clear localStorage
    localStorage.clear();
  });

  test('rates a track and persists across sessions', () => {
    // 1. Simulate track metadata arriving
    const mockMetadata = {
      title: 'Stay Young, Go Dancing',
      artist: 'Death Cab For Cutie'
    };

    // 2. User rates the track
    saveRating(mockMetadata.artist, mockMetadata.title, 4);

    // 3. Verify localStorage
    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['death cab for cutie_stay young, go dancing']).toBe(4);

    // 4. Simulate page reload - clear and reload from storage
    const newTrackRatings = JSON.parse(localStorage.getItem('trackRatings') || '{}');
    expect(newTrackRatings['death cab for cutie_stay young, go dancing']).toBe(4);

    // 5. Load rating for same track
    const rating = loadRating(mockMetadata.artist, mockMetadata.title);
    expect(rating).toBe(4);

    // 6. Update display and verify
    updateStarDisplay(rating);
    const stars = document.querySelectorAll('.star');
    expect(stars[3].classList.contains('filled')).toBe(true);
    expect(document.getElementById('ratingText').textContent).toBe('4 stars');
  });

  test('different tracks maintain separate ratings', () => {
    // Rate first track
    const track1 = { title: 'Song 1', artist: 'Artist 1' };
    saveRating(track1.artist, track1.title, 3);
    updateStarDisplay(3);

    let stars = document.querySelectorAll('.star');
    expect(stars[2].classList.contains('filled')).toBe(true);
    expect(stars[3].classList.contains('filled')).toBe(false);

    // Rate second track
    const track2 = { title: 'Song 2', artist: 'Artist 2' };
    saveRating(track2.artist, track2.title, 5);
    updateStarDisplay(5);

    stars = document.querySelectorAll('.star');
    expect(stars[4].classList.contains('filled')).toBe(true);

    // Verify both ratings are stored independently
    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['artist 1_song 1']).toBe(3);
    expect(stored['artist 2_song 2']).toBe(5);

    // Load first track rating again
    const rating1 = loadRating(track1.artist, track1.title);
    expect(rating1).toBe(3);

    // Load second track rating
    const rating2 = loadRating(track2.artist, track2.title);
    expect(rating2).toBe(5);
  });

  test('complete user journey: multiple tracks over time', () => {
    const tracks = [
      { artist: 'Radiohead', title: 'Karma Police', rating: 5 },
      { artist: 'Death Cab For Cutie', title: 'I Will Follow You Into The Dark', rating: 4 },
      { artist: 'Björk', title: 'Jóga', rating: 5 },
      { artist: 'Unknown', title: 'Unknown', rating: 3 }
    ];

    // User listens and rates multiple tracks
    tracks.forEach(track => {
      saveRating(track.artist, track.title, track.rating);
      updateStarDisplay(track.rating);

      const stars = document.querySelectorAll('.star');
      expect(stars[track.rating - 1].classList.contains('filled')).toBe(true);
    });

    // Verify all ratings persisted
    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(Object.keys(stored).length).toBe(4);

    // Verify each can be loaded correctly
    tracks.forEach(track => {
      const loadedRating = loadRating(track.artist, track.title);
      expect(loadedRating).toBe(track.rating);
    });
  });

  test('changing rating updates both storage and display', () => {
    const track = { artist: 'Test Artist', title: 'Test Song' };

    // Initial rating
    saveRating(track.artist, track.title, 2);
    updateStarDisplay(2);

    let stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored[getTrackKey(track.artist, track.title)]).toBe(2);

    let stars = document.querySelectorAll('.star');
    expect(stars[1].classList.contains('filled')).toBe(true);
    expect(stars[2].classList.contains('filled')).toBe(false);

    // Change rating
    saveRating(track.artist, track.title, 5);
    updateStarDisplay(5);

    stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored[getTrackKey(track.artist, track.title)]).toBe(5);

    stars = document.querySelectorAll('.star');
    expect(stars[4].classList.contains('filled')).toBe(true);
    expect(document.getElementById('ratingText').textContent).toBe('5 stars');

    // Verify only one entry exists for this track
    expect(Object.keys(stored).length).toBe(1);
  });

  test('handles edge case: rating same track multiple times', () => {
    const track = { artist: 'Artist', title: 'Song' };

    // Rate multiple times
    for (let rating = 1; rating <= 5; rating++) {
      saveRating(track.artist, track.title, rating);

      const stored = JSON.parse(localStorage.getItem('trackRatings'));
      expect(stored[getTrackKey(track.artist, track.title)]).toBe(rating);

      // Verify only one entry
      expect(Object.keys(stored).length).toBe(1);
    }

    // Final rating should be 5
    expect(loadRating(track.artist, track.title)).toBe(5);
  });
});
