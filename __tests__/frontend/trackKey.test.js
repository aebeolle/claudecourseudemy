const { getTrackKey } = require('../../public/script.js');

describe('getTrackKey', () => {
  test('generates lowercase key from artist and title', () => {
    expect(getTrackKey('Death Cab For Cutie', 'Stay Young, Go Dancing'))
      .toBe('death cab for cutie_stay young, go dancing');
  });

  test('handles missing artist with "Unknown"', () => {
    expect(getTrackKey(null, 'Some Song'))
      .toBe('unknown_some song');
  });

  test('handles missing title with "Unknown"', () => {
    expect(getTrackKey('Artist', null))
      .toBe('artist_unknown');
  });

  test('handles both missing with "Unknown_Unknown"', () => {
    expect(getTrackKey(null, null))
      .toBe('unknown_unknown');
  });

  test('normalizes case sensitivity', () => {
    const key1 = getTrackKey('RADIOHEAD', 'Karma Police');
    const key2 = getTrackKey('radiohead', 'karma police');
    expect(key1).toBe(key2);
  });

  test('handles empty strings', () => {
    expect(getTrackKey('', ''))
      .toBe('unknown_unknown');
  });

  test('preserves special characters in lowercase', () => {
    expect(getTrackKey('Björk', 'Jóga'))
      .toBe('björk_jóga');
  });
});
