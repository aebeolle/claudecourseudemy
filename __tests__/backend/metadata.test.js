describe('Metadata Parsing', () => {
  function parseStreamTitle(streamTitle) {
    let title = streamTitle;
    let artist = '';

    if (streamTitle.includes(' - ')) {
      const parts = streamTitle.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    return { title, artist };
  }

  test('parses standard "Artist - Title" format', () => {
    const result = parseStreamTitle('Death Cab For Cutie - Stay Young, Go Dancing');
    expect(result.artist).toBe('Death Cab For Cutie');
    expect(result.title).toBe('Stay Young, Go Dancing');
  });

  test('handles multiple dashes in title', () => {
    const result = parseStreamTitle('Artist - Title - Subtitle - Version');
    expect(result.artist).toBe('Artist');
    expect(result.title).toBe('Title - Subtitle - Version');
  });

  test('handles title without artist separator', () => {
    const result = parseStreamTitle('Just A Title');
    expect(result.artist).toBe('');
    expect(result.title).toBe('Just A Title');
  });

  test('trims whitespace from artist and title', () => {
    const result = parseStreamTitle('  Artist Name  -  Song Title  ');
    expect(result.artist).toBe('Artist Name');
    expect(result.title).toBe('Song Title');
  });

  test('handles empty string', () => {
    const result = parseStreamTitle('');
    expect(result.artist).toBe('');
    expect(result.title).toBe('');
  });

  test('handles single dash with no spaces', () => {
    const result = parseStreamTitle('Artist-Title');
    expect(result.artist).toBe('');
    expect(result.title).toBe('Artist-Title');
  });

  test('handles dash at beginning', () => {
    const result = parseStreamTitle(' - Title');
    expect(result.artist).toBe('');
    expect(result.title).toBe('Title');
  });

  test('handles dash at end', () => {
    const result = parseStreamTitle('Artist - ');
    expect(result.artist).toBe('Artist');
    expect(result.title).toBe('');
  });

  test('preserves special characters', () => {
    const result = parseStreamTitle('Björk - Jóga');
    expect(result.artist).toBe('Björk');
    expect(result.title).toBe('Jóga');
  });

  test('handles very long strings', () => {
    const longArtist = 'A'.repeat(100);
    const longTitle = 'B'.repeat(100);
    const result = parseStreamTitle(`${longArtist} - ${longTitle}`);
    expect(result.artist).toBe(longArtist);
    expect(result.title).toBe(longTitle);
  });
});
