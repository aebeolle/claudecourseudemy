describe('Icecast ICY Metadata Parser', () => {
  function parseIcyMetadata(buffer, metaInt) {
    // Extract metadata block
    const metaLength = buffer[metaInt] * 16;
    if (metaLength === 0) return null;

    const metaString = buffer.slice(metaInt + 1, metaInt + 1 + metaLength).toString('latin1');

    // Extract StreamTitle
    const titleMatch = metaString.match(/StreamTitle='([^']+)'/);
    return titleMatch ? titleMatch[1] : null;
  }

  test('extracts StreamTitle from ICY metadata', () => {
    // Create mock buffer with ICY metadata
    const metaString = "StreamTitle='Artist - Song Title';StreamUrl='';";
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 100;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    expect(result).toBe('Artist - Song Title');
  });

  test('returns null when metadata length is 0', () => {
    const buffer = Buffer.alloc(200);
    buffer[100] = 0; // metaLength = 0

    const result = parseIcyMetadata(buffer, 100);
    expect(result).toBe(null);
  });

  test('handles malformed metadata gracefully', () => {
    const metaString = "InvalidMetadata";
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 10;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    expect(result).toBe(null);
  });

  test('extracts StreamTitle with special characters', () => {
    const metaString = "StreamTitle='Björk - Jóga';StreamUrl='';";
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 50;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    expect(result).toBe('Björk - Jóga');
  });

  test('handles StreamTitle with quotes in content', () => {
    // Note: ICY format doesn't typically handle nested quotes well,
    // but we test the current behavior - regex will match up to nested quote
    const metaString = "StreamTitle='Artist - Song With \"Quotes\"';";
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 30;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    // Regex matches everything between first pair of single quotes, including escaped quotes
    expect(result).toBe('Artist - Song With \"Quotes\"');
  });

  test('handles empty StreamTitle', () => {
    const metaString = "StreamTitle='';StreamUrl='http://example.com';";
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 20;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    // Empty StreamTitle returns null because regex requires at least one character ([^']+)
    expect(result).toBe(null);
  });

  test('handles very long StreamTitle', () => {
    const longTitle = 'A'.repeat(200);
    const metaString = `StreamTitle='${longTitle}';`;
    const metaBuffer = Buffer.from(metaString, 'latin1');

    const metaInt = 100;
    const buffer = Buffer.alloc(metaInt + 1 + metaBuffer.length);
    buffer[metaInt] = Math.ceil(metaBuffer.length / 16);
    metaBuffer.copy(buffer, metaInt + 1);

    const result = parseIcyMetadata(buffer, metaInt);
    expect(result).toBe(longTitle);
  });
});
