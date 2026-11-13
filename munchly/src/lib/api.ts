import { API_BASE_URL, PREVIEW_MODE } from './config';
import { demoAnalysis } from './demo';
import type { Analysis } from './types';

const TIMEOUT_MS = 90_000;

export async function requestAnalysis(input: {
  imageBase64?: string;
  mediaType?: string;
  description?: string;
}): Promise<Analysis> {
  if (PREVIEW_MODE) {
    // Preview builds have no server: pretend to think for a moment, then return sample data.
    await new Promise((resolve) => setTimeout(resolve, 1600));
    return demoAnalysis(!input.imageBase64);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const appKey = process.env.EXPO_PUBLIC_MUNCHLY_APP_KEY;
    if (appKey) headers['x-munchly-key'] = appKey;

    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => null)) as (Analysis & { error?: string }) | null;
    if (!res.ok || !data) throw new Error(data?.error ?? 'Couldn’t reach Munchly. Check your connection.');
    return data;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('That took too long. Please try again.');
    }
    if (err instanceof TypeError) throw new Error('Couldn’t reach Munchly. Check your connection.');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
