// services/translation/index.ts — Translation via Google Cloud Translation API
// Free tier: 500K chars/month. Falls back to no-op if key is missing.
import { getCachedTranslation, setCachedTranslation } from './cache';
import { saveTranslation } from '../firebase/collections/messages';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_TRANSLATE_API_KEY ?? '';
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

export const SUPPORTED_LANGUAGES = [
  'en', 'es', 'zh', 'vi', 'ar', 'tl', 'ht', 'pt', 'fr', 'ko',
] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/** Translate a single string. Returns original text if translation unavailable. */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'en',
): Promise<string> {
  if (!text.trim()) return text;
  if (targetLang === sourceLang) return text;
  if (!API_KEY) return text; // No key configured — no-op

  // Check cache first
  const cached = await getCachedTranslation(text, sourceLang, targetLang);
  if (cached) return cached;

  try {
    const res = await fetch(`${TRANSLATE_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!res.ok) {
      console.warn(`Translation API error ${res.status}`);
      return text;
    }

    const data = await res.json();
    const translated: string = data?.data?.translations?.[0]?.translatedText ?? text;

    await setCachedTranslation(text, sourceLang, targetLang, translated);
    return translated;
  } catch (err) {
    console.error('Translation error:', err);
    return text;
  }
}

/**
 * Translate a message into all supported languages that differ from the source,
 * persist results to Firestore, and return the map.
 */
export async function translateMessageToAll(
  conversationId: string,
  messageId: string,
  text: string,
  sourceLang: SupportedLanguage = 'en',
): Promise<Record<string, string>> {
  if (!API_KEY) return {};

  const targets = SUPPORTED_LANGUAGES.filter(l => l !== sourceLang);
  const results: Record<string, string> = {};

  await Promise.allSettled(
    targets.map(async lang => {
      const translated = await translateText(text, lang, sourceLang);
      if (translated !== text) {
        results[lang] = translated;
        await saveTranslation(conversationId, messageId, lang, translated).catch(console.error);
      }
    }),
  );

  return results;
}

/** Detect language of a string using the API's detect endpoint. */
export async function detectLanguage(text: string): Promise<string> {
  if (!API_KEY || !text.trim()) return 'en';
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text }),
      },
    );
    if (!res.ok) return 'en';
    const data = await res.json();
    return data?.data?.detections?.[0]?.[0]?.language ?? 'en';
  } catch {
    return 'en';
  }
}
