const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function onRequestOptions() {
  return new Response(null, { headers: CORS_HEADERS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const { passphrase, issue } = body;

  if (!passphrase || passphrase !== env.ACCESS_CODE) {
    return new Response(JSON.stringify({ error: "Invalid access code." }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  if (!issue || typeof issue !== "string" || !issue.trim()) {
    return new Response(JSON.stringify({ error: "A policy issue is required." }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const prompt = `You are an analytical political scientist. A user has entered the following policy issue: '${issue.trim()}'

Score each of the five Political Will variables on a 1-10 scale based on the current U.S. political context. Return ONLY a JSON object with no preamble:
{
  "visibility": { "score": number, "reason": "one sentence justification" },
  "constituency": { "score": number, "reason": "one sentence justification" },
  "cost": { "score": number, "reason": "one sentence justification" },
  "opposition": { "score": number, "reason": "one sentence justification" },
  "frames": { "score": number, "reason": "one sentence justification" }
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return new Response(JSON.stringify({ error: "AI scoring failed. Try again." }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text || "";

    let scores;
    try {
      scores = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse AI response.", raw }), {
        status: 502,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(scores), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
}
