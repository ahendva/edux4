// services/translation/cache.ts — In-memory + AsyncStorage translation cache
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'tx_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  text: string;
  ts: number;
}

// In-memory layer: lives for the current session
const memCache = new Map<string, string>();

function cacheKey(text: string, from: string, to: string): string {
  // Simple hash: combine first 60 chars + length to keep keys short
  const snippet = text.slice(0, 60).replace(/\s+/g, ' ');
  return `${CACHE_PREFIX}${from}_${to}_${snippet.length}_${snippet}`;
}

export async function getCachedTranslation(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<string | null> {
  const key = cacheKey(text, fromLang, toLang);

  // 1. Check memory cache first
  if (memCache.has(key)) return memCache.get(key)!;

  // 2. Check AsyncStorage
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.ts < CACHE_TTL_MS) {
        memCache.set(key, entry.text);
        return entry.text;
      }
      // Expired — remove
      await AsyncStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable; skip cache
  }
  return null;
}

export async function setCachedTranslation(
  text: string,
  fromLang: string,
  toLang: string,
  translated: string,
): Promise<void> {
  const key = cacheKey(text, fromLang, toLang);
  memCache.set(key, translated);
  try {
    const entry: CacheEntry = { text: translated, ts: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage unavailable; memory cache still works
  }
}

export function clearMemoryCache(): void {
  memCache.clear();
}
