/** Generic server-side Gemini JSON call. Input text is treated as untrusted data. */
export async function callGemini(system, userText) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Object.assign(new Error('AI is not configured on the server (GEMINI_API_KEY).'), { status: 503 });
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const base = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com/v1beta';
  let res;
  try {
    res = await fetch(`${base}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
  } catch { throw Object.assign(new Error('Could not reach the AI service.'), { status: 502 }); }
  if (!res.ok) throw Object.assign(new Error('AI service error (' + res.status + ')'), { status: 502 });
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  try { return JSON.parse(raw.replace(/^```json|```$/g, '').trim()); }
  catch { throw Object.assign(new Error('AI returned unreadable output. Try again.'), { status: 502 }); }
}
