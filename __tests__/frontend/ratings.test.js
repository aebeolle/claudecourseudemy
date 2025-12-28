const { saveRating, loadRating, getTrackKey } = require('../../public/script.js');

describe('Rating Persistence', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('saveRating stores rating with correct key', () => {
    saveRating('Artist', 'Title', 4);

    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['artist_title']).toBe(4);
  });

  test('loadRating retrieves correct rating', () => {
    localStorage.setItem('trackRatings',
      JSON.stringify({'artist_title': 5}));

    const rating = loadRating('Artist', 'Title');
    expect(rating).toBe(5);
  });

  test('loadRating returns 0 for unrated track', () => {
    localStorage.setItem('trackRatings', JSON.stringify({}));

    const rating = loadRating('New Artist', 'New Song');
    expect(rating).toBe(0);
  });

  test('saveRating updates existing rating', () => {
    saveRating('Artist', 'Title', 3);
    saveRating('Artist', 'Title', 5);

    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['artist_title']).toBe(5);
  });

  test('multiple ratings are stored independently', () => {
    saveRating('Artist1', 'Title1', 4);
    saveRating('Artist2', 'Title2', 5);

    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['artist1_title1']).toBe(4);
    expect(stored['artist2_title2']).toBe(5);
  });

  test('handles rating values from 1 to 5', () => {
    for (let rating = 1; rating <= 5; rating++) {
      saveRating('Artist', `Track${rating}`, rating);
      expect(loadRating('Artist', `Track${rating}`)).toBe(rating);
    }
  });

  test('persists across multiple save operations', () => {
    saveRating('A1', 'T1', 3);
    saveRating('A2', 'T2', 4);
    saveRating('A3', 'T3', 5);

    expect(loadRating('A1', 'T1')).toBe(3);
    expect(loadRating('A2', 'T2')).toBe(4);
    expect(loadRating('A3', 'T3')).toBe(5);
  });

  test('handles special characters in artist/title', () => {
    saveRating('Björk', 'Jóga', 5);

    const stored = JSON.parse(localStorage.getItem('trackRatings'));
    expect(stored['björk_jóga']).toBe(5);
    expect(loadRating('Björk', 'Jóga')).toBe(5);
  });
});
