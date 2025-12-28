const { updateStarDisplay } = require('../../public/script.js');

describe('updateStarDisplay', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = `
      <div class="star-rating">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <span class="rating-text" id="ratingText">Rate this track</span>
    `;
  });

  test('fills correct number of stars', () => {
    updateStarDisplay(3);

    const stars = document.querySelectorAll('.star');
    expect(stars[0].classList.contains('filled')).toBe(true);
    expect(stars[1].classList.contains('filled')).toBe(true);
    expect(stars[2].classList.contains('filled')).toBe(true);
    expect(stars[3].classList.contains('filled')).toBe(false);
    expect(stars[4].classList.contains('filled')).toBe(false);
  });

  test('updates rating text correctly', () => {
    updateStarDisplay(4);

    const ratingText = document.getElementById('ratingText');
    expect(ratingText.textContent).toBe('4 stars');
  });

  test('handles singular "star" for rating of 1', () => {
    updateStarDisplay(1);

    const ratingText = document.getElementById('ratingText');
    expect(ratingText.textContent).toBe('1 star');
  });

  test('displays default text for 0 rating', () => {
    updateStarDisplay(0);

    const ratingText = document.getElementById('ratingText');
    expect(ratingText.textContent).toBe('Rate this track');
  });

  test('clears all stars for 0 rating', () => {
    updateStarDisplay(0);

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
      expect(star.classList.contains('filled')).toBe(false);
    });
  });

  test('fills all 5 stars for maximum rating', () => {
    updateStarDisplay(5);

    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
      expect(star.classList.contains('filled')).toBe(true);
    });

    const ratingText = document.getElementById('ratingText');
    expect(ratingText.textContent).toBe('5 stars');
  });

  test('handles rating transitions', () => {
    // Start with 3 stars
    updateStarDisplay(3);
    let stars = document.querySelectorAll('.star');
    expect(stars[2].classList.contains('filled')).toBe(true);
    expect(stars[3].classList.contains('filled')).toBe(false);

    // Update to 5 stars
    updateStarDisplay(5);
    stars = document.querySelectorAll('.star');
    expect(stars[4].classList.contains('filled')).toBe(true);

    // Update to 1 star
    updateStarDisplay(1);
    stars = document.querySelectorAll('.star');
    expect(stars[0].classList.contains('filled')).toBe(true);
    expect(stars[1].classList.contains('filled')).toBe(false);
  });
});
