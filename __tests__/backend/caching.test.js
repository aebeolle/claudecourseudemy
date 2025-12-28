describe('Metadata Caching', () => {
  let metadataCache;

  beforeEach(() => {
    metadataCache = {
      data: null,
      timestamp: 0,
      cacheDuration: 10000  // 10 seconds
    };
  });

  function isCacheValid(cache, now) {
    return cache.data && (now - cache.timestamp) < cache.cacheDuration;
  }

  test('returns cached data within TTL', () => {
    const now = Date.now();
    metadataCache.data = { title: 'Test', artist: 'Artist' };
    metadataCache.timestamp = now - 5000; // 5 seconds ago

    const shouldUseCache = isCacheValid(metadataCache, now);
    expect(shouldUseCache).toBe(true);
  });

  test('cache expires after 10 seconds', () => {
    const now = Date.now();
    metadataCache.data = { title: 'Test', artist: 'Artist' };
    metadataCache.timestamp = now - 11000; // 11 seconds ago

    const shouldUseCache = isCacheValid(metadataCache, now);
    expect(shouldUseCache).toBe(false);
  });

  test('cache is not used when empty', () => {
    const now = Date.now();

    const shouldUseCache = isCacheValid(metadataCache, now);
    // Should be falsy (false, null, or undefined)
    expect(shouldUseCache).toBeFalsy();
  });

  test('cache expires exactly at TTL boundary', () => {
    const now = Date.now();
    metadataCache.data = { title: 'Test', artist: 'Artist' };
    metadataCache.timestamp = now - 10000; // Exactly 10 seconds ago

    const shouldUseCache = isCacheValid(metadataCache, now);
    expect(shouldUseCache).toBe(false);
  });

  test('fresh cache (1ms old) is valid', () => {
    const now = Date.now();
    metadataCache.data = { title: 'Test', artist: 'Artist' };
    metadataCache.timestamp = now - 1;

    const shouldUseCache = isCacheValid(metadataCache, now);
    expect(shouldUseCache).toBe(true);
  });

  test('cache with different duration settings', () => {
    const now = Date.now();
    const cache = {
      data: { title: 'Test' },
      timestamp: now - 5000,
      cacheDuration: 3000  // 3 seconds
    };

    expect(isCacheValid(cache, now)).toBe(false);

    cache.cacheDuration = 6000;  // 6 seconds
    expect(isCacheValid(cache, now)).toBe(true);
  });
});
