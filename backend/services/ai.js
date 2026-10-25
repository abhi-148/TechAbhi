
/** Generic server-side Gemini JSON call. Input text is untrusted data. */
export async function callGemini(system, userText) {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw Object.assign(
      new Error('AI is not configured on the server (GEMINI_API_KEY).'),
      { status: 503 }
    );
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const base =
    process.env.GEMINI_API_BASE ||
    'https://generativelanguage.googleapis.com/v1beta';

  let res;

  try {
    res = await fetch(
      `${base}/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: system }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userText }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
  } catch (error) {
    console.error('Gemini network error:', error.message);

    throw Object.assign(
      new Error('Could not reach the AI service.'),
      { status: 502 }
    );
  }

  if (!res.ok) {
    const details = await res.text().catch(() => '');

    // Do not log the API key or request headers.
    console.error('Gemini API error:', {
      status: res.status,
      details: details.slice(0, 2000),
    });

    throw Object.assign(
      new Error(`AI service error (${res.status})`),
      { status: 502 }
    );
  }

  const data = await res.json();

  const raw =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('') || '';

  if (!raw.trim()) {
    console.error(
      'Gemini returned no text. Finish reason:',
      data?.candidates?.[0]?.finishReason
    );

    throw Object.assign(
      new Error('AI returned no usable text. Try again.'),
      { status: 502 }
    );
  }

  try {
    return JSON.parse(
      raw.replace(/^```json\s*|```\s*$/g, '').trim()
    );
  } catch {
    console.error('Gemini returned invalid JSON.');

    throw Object.assign(
      new Error('AI returned unreadable output. Try again.'),
      { status: 502 }
    );
  }
}
