import { openai } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { checkRateLimit, getRateLimitConfig } from '@/lib/rate-limit';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Check rate limit before processing the request
    const rateLimitResult = await checkRateLimit();

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: rateLimitResult.error || 'Rate limit exceeded',
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': getRateLimitConfig(rateLimitResult.role).limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.reset > 0 
              ? Math.max(0, Math.ceil((rateLimitResult.reset - Date.now()) / 1000)).toString()
              : '0',
          },
        },
      );
    }

    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: 'You are a helpful AI assistant. Be concise and friendly.',
      messages: convertToModelMessages(messages),
    });

    // Add rate limit headers to successful response
    const response = result.toUIMessageStreamResponse();
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', getRateLimitConfig(rateLimitResult.role).limit.toString());
    headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
