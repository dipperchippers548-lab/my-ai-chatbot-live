/**
 * Server-only code: sends a food photo or description to Claude and returns calories + macros.
 * Runs inside the Expo Router API route (src/app/api/analyze+api.ts), never in the app bundle,
 * so the Anthropic API key stays on the server.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

import { demoAnalysis } from '../lib/demo';
import type { Analysis } from '../lib/types';

const MODEL = process.env.MUNCHLY_MODEL || 'claude-opus-5-5';
const EFFORT = (process.env.MUNCHLY_EFFORT || 'low') as 'low' | 'medium' | 'high';

export const MAX_DESCRIPTION_CHARS = 300;
/** ~5 MB of image data once base64-encoded. The app sends ~150 KB, so this is generous. */
export const MAX_IMAGE_BASE64_CHARS = 7_000_000;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

const AnalysisSchema = z.object({
  is_food: z.boolean(),
  meal_name: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      portion: z.string(),
      calories: z.number(),
      protein_g: z.number(),
      carbs_g: z.number(),
      fat_g: z.number(),
    }),
  ),
  confidence: z.enum(['low', 'medium', 'high']),
  note: z.string(),
});

const SYSTEM_PROMPT = `You are the nutrition estimator inside Munchly, a calorie tracking app. People send you a photo of food or a short description of what they ate, and you estimate the calories and macros so they can log it in one tap.

How to estimate:
- List each distinct food or drink as its own item (for example a burger, fries and a soda are three items). Combine tiny garnishes into the dish they belong to.
- Estimate the portion from visual cues such as plate and bowl size, utensils, hands, and packaging. Write the portion the way a person would say it, with a weight or volume, like "1 medium bowl (350 g)" or "2 slices".
- Base calories and macros on standard nutrition references (for example USDA FoodData Central) for that portion. Be realistic rather than optimistic: include visible cooking oil, butter, sauces, dressings and toppings, because leaving them out is the most common reason calorie estimates come out too low.
- If a nutrition label or a packaged product is visible, use the label values for one serving unless the photo clearly shows a different amount.
- For a description, use the amounts the person gives. If they give none, assume one typical serving.
- When something is ambiguous (for example whole versus skim milk), choose the most likely option and mention the assumption in the note.

Fields:
- is_food: false if the image or text is not food or drink. Then return an empty items list, meal_name "Not food", and a note saying what you see instead.
- meal_name: a short name for the whole meal, 1 to 4 words.
- items: name in 1 to 4 words; calories as a whole number; protein_g, carbs_g and fat_g in grams rounded to one decimal.
- confidence: "high" when the food and portion are clear, "medium" when the portion is a rough guess, "low" when the food itself is hard to identify.
- note: one friendly sentence under 120 characters, usually the main assumption you made. Never give medical or diet advice.

Write food names in the same language as the person's description; for photos without text, use English.`;

export class AnalyzeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface AnalyzeInput {
  imageBase64?: string;
  mediaType?: string;
  description?: string;
}

export function isDemoMode(): boolean {
  return process.env.MUNCHLY_DEMO_MODE === 'true' || !process.env.ANTHROPIC_API_KEY;
}

export function validateInput(body: unknown): AnalyzeInput {
  if (!body || typeof body !== 'object') throw new AnalyzeError(400, 'Send a photo or a description.');
  const { imageBase64, mediaType, description } = body as Record<string, unknown>;

  const out: AnalyzeInput = {};
  if (typeof imageBase64 === 'string' && imageBase64.length > 0) {
    if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) throw new AnalyzeError(413, 'That photo is too large.');
    const type = typeof mediaType === 'string' ? mediaType : 'image/jpeg';
    if (!IMAGE_TYPES.includes(type as ImageType)) throw new AnalyzeError(400, 'Unsupported image type.');
    out.imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    out.mediaType = type;
  }
  if (typeof description === 'string' && description.trim().length > 0) {
    out.description = description.trim().slice(0, MAX_DESCRIPTION_CHARS);
  }
  if (!out.imageBase64 && !out.description) throw new AnalyzeError(400, 'Send a photo or a description.');
  return out;
}

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic();
  return client;
}

export async function analyzeFood(input: AnalyzeInput): Promise<Analysis> {
  if (isDemoMode()) return demoAnalysis(!input.imageBase64);

  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (input.imageBase64) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: input.mediaType as ImageType, data: input.imageBase64 },
    });
  }
  content.push({
    type: 'text',
    text: input.description
      ? `${input.imageBase64 ? 'Extra details from the person' : 'What the person ate'}: ${input.description}`
      : 'Estimate the calories and macros for the food in this photo.',
  });

  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content }],
      output_config: { effort: EFFORT, format: betaZodOutputFormat(AnalysisSchema) },
      // If the model declines for policy reasons, retry server-side on Anthropic's recommended fallback.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new AnalyzeError(500, 'The server’s AI key is not set up correctly.');
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new AnalyzeError(429, 'Munchly is busy right now. Try again in a minute.');
    }
    if (err instanceof Anthropic.APIError) {
      console.error('Claude API error', err.status, err.message);
      throw new AnalyzeError(502, 'Couldn’t analyze that right now. Please try again.');
    }
    throw err;
  }

  if (response.stop_reason === 'refusal') {
    throw new AnalyzeError(422, 'Couldn’t analyze that one. Try another photo.');
  }
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
    throw new AnalyzeError(502, 'Couldn’t read the result. Please try again.');
  }

  return toAnalysis(response.parsed_output);
}

function clean(n: number, max: number) {
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
}

function toAnalysis(raw: z.infer<typeof AnalysisSchema>): Analysis {
  return {
    isFood: raw.is_food,
    mealName: raw.meal_name.slice(0, 60),
    confidence: raw.confidence,
    note: raw.note.slice(0, 200),
    items: raw.is_food
      ? raw.items.slice(0, 20).map((it) => ({
          name: it.name.slice(0, 60),
          portion: it.portion.slice(0, 60),
          calories: Math.round(clean(it.calories, 5000)),
          proteinG: Math.round(clean(it.protein_g, 500) * 10) / 10,
          carbsG: Math.round(clean(it.carbs_g, 800) * 10) / 10,
          fatG: Math.round(clean(it.fat_g, 400) * 10) / 10,
        }))
      : [],
  };
}
