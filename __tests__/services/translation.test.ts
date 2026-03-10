// __tests__/services/translation.test.ts
import { translateText } from '../../services/translation/index';
import { getCachedTranslation, setCachedTranslation } from '../../services/translation/cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

describe('Translation cache', () => {
  it('returns null for uncached text', async () => {
    const result = await getCachedTranslation('hello world', 'en', 'es');
    expect(result).toBeNull();
  });

  it('caches and retrieves translation in memory', async () => {
    await setCachedTranslation('good morning', 'en', 'es', 'buenos días');
    const result = await getCachedTranslation('good morning', 'en', 'es');
    expect(result).toBe('buenos días');
  });

  it('returns different cache entries for different language pairs', async () => {
    await setCachedTranslation('hello', 'en', 'es', 'hola');
    await setCachedTranslation('hello', 'en', 'fr', 'bonjour');
    const es = await getCachedTranslation('hello', 'en', 'es');
    const fr = await getCachedTranslation('hello', 'en', 'fr');
    expect(es).toBe('hola');
    expect(fr).toBe('bonjour');
  });
});

describe('translateText', () => {
  it('returns original text when source equals target', async () => {
    const result = await translateText('hello', 'en', 'en');
    expect(result).toBe('hello');
  });

  it('returns original text for empty input', async () => {
    const result = await translateText('', 'en', 'es');
    expect(result).toBe('');
  });

  it('returns original text when API key is not configured', async () => {
    // EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY is not set in test env
    const result = await translateText('hello world', 'es', 'en');
    expect(result).toBe('hello world');
  });
});
