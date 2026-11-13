import { analyzeFood, AnalyzeError, validateInput } from '@/server/analyze';

/**
 * POST /api/analyze
 * Body: { imageBase64?: string, mediaType?: string, description?: string }
 * Returns: Analysis (see src/lib/types.ts) or { error: string }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Optional shared key. It keeps random scripts off the endpoint, but it ships inside the app,
    // so it is not real security. Before scaling ads, also check the user's subscription here.
    const appKey = process.env.MUNCHLY_APP_KEY;
    if (appKey && request.headers.get('x-munchly-key') !== appKey) {
      return Response.json({ error: 'Not allowed.' }, { status: 401 });
    }

    const length = Number(request.headers.get('content-length') ?? 0);
    if (length > 8_000_000) return Response.json({ error: 'That photo is too large.' }, { status: 413 });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
    }

    const result = await analyzeFood(validateInput(body));
    return Response.json(result);
  } catch (err) {
    if (err instanceof AnalyzeError) return Response.json({ error: err.message }, { status: err.status });
    console.error('analyze failed', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
