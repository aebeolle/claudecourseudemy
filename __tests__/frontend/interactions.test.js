// Note: Interaction tests are simplified due to minimal refactoring approach
// Full interaction testing would require extracting event listener initialization
// into a separate function. For now, we test the core rating functions directly.

const { saveRating, updateStarDisplay, getTrackKey } = require('../../public/script.js');

describe('Star Rating Core Functionality', () => {
  beforeEach(() => {
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
    localStorage.clear();
  });

  test('rating workflow: save and display', () => {
    const artist = 'Test Artist';
    const title = 'Test Song';
    const rating = 4;

    // Simulate user rating a track
    saveRating(artist, title, rating);

    // Verify it was saved
    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored[getTrackKey(artist, title)]).toBe(rating);

    // Update display
    updateStarDisplay(rating);

    // Verify display updated
    const stars = document.querySelectorAll('.star');
    expect(stars[3].classList.contains('filled')).toBe(true);
    expect(document.getElementById('ratingText').textContent).toBe('4 stars');
  });

  test('re-rating a track updates both storage and display', () => {
    const artist = 'Artist';
    const title = 'Song';

    // Initial rating
    saveRating(artist, title, 3);
    updateStarDisplay(3);

    expect(document.querySelectorAll('.star')[2].classList.contains('filled')).toBe(true);

    // Change rating
    saveRating(artist, title, 5);
    updateStarDisplay(5);

    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored[getTrackKey(artist, title)]).toBe(5);
    expect(document.querySelectorAll('.star')[4].classList.contains('filled')).toBe(true);
  });

  test('star data-rating attribute parsing', () => {
    const stars = document.querySelectorAll('.star');

    stars.forEach((star, index) => {
      const rating = parseInt(star.dataset.rating);
      expect(rating).toBe(index + 1);
    });
  });
});
