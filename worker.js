const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function handleAnalyze(body, env) {
  const { passphrase, visibility, constituency, cost, opposition, frames, scenario } = body;

  if (!passphrase || passphrase !== env.ACCESS_CODE) {
    return jsonResponse({ error: "Invalid access code." }, 401);
  }

  const vals = [visibility, constituency, cost, opposition, frames];
  if (vals.some(v => v === undefined || isNaN(v) || v < 1 || v > 10)) {
    return jsonResponse({ error: "All slider values must be between 1 and 10." }, 400);
  }

  const score = (visibility * constituency * cost) / ((opposition * frames) + 0.001);

  const prompt = `You are an analytical political strategy advisor. A user has input the following values into the Political Will Strategy Engine:

SCENARIO: ${scenario || "Custom"}
FORMULA: P.W. = (V × S × C) / (O × F)

INPUTS:
- Visibility of Harm (V): ${visibility}/10 — how visible the issue is to the public
- Size of Affected Constituency (S): ${constituency}/10 — how many people are affected
- Cost of Inaction (C): ${cost}/10 — electoral/economic risk to leaders for doing nothing
- Organized Opposition Power (O): ${opposition}/10 — lobbying and institutional resistance
- Availability of Alternative Frames (F): ${frames}/10 — distraction narratives available to opponents

CALCULATED POLITICAL WILL SCORE: ${score.toFixed(2)}

Provide a rigorous, analytical strategic assessment in this exact JSON structure:
{
  "summary": "2-3 sentence analytical summary of the current political landscape based on these inputs",
  "bottleneck": "The single most critical constraint limiting political will right now (1 sentence)",
  "options": [
    {
      "title": "Strategy option title",
      "approach": "Detailed description of this strategic approach",
      "tradeoff": "What this strategy sacrifices or risks",
      "timeframe": "Short-term (weeks) | Medium-term (months) | Long-term (years)"
    },
    {
      "title": "Strategy option title",
      "approach": "Detailed description of this strategic approach",
      "tradeoff": "What this strategy sacrifices or risks",
      "timeframe": "Short-term (weeks) | Medium-term (months) | Long-term (years)"
    },
    {
      "title": "Strategy option title",
      "approach": "Detailed description of this strategic approach",
      "tradeoff": "What this strategy sacrifices or risks",
      "timeframe": "Short-term (weeks) | Medium-term (months) | Long-term (years)"
    }
  ],
  "priority_move": "The single highest-leverage action to take right now, explained in 1-2 sentences",
  "denominator_insight": "Specific insight about the denominator (O × F) and whether attacking it is more efficient than building the numerator"
}

Respond ONLY with the JSON object. No preamble, no markdown, no explanation outside the JSON.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Anthropic API error:", err);
    return jsonResponse({ error: "AI analysis failed. Try again." }, 502);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || "";

  let analysis;
  try {
    analysis = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return jsonResponse({ error: "Could not parse AI response.", raw }, 502);
  }

  return jsonResponse({ score: score.toFixed(2), analysis });
}

async function handleScore(body, env) {
  const { passphrase, issue } = body;

  if (!passphrase || passphrase !== env.ACCESS_CODE) {
    return jsonResponse({ error: "Invalid access code." }, 401);
  }

  if (!issue || typeof issue !== "string" || !issue.trim()) {
    return jsonResponse({ error: "A policy issue is required." }, 400);
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
    return jsonResponse({ error: "AI scoring failed. Try again." }, 502);
  }

  const data = await response.json();
  const raw = data.content?.[0]?.text || "";

  let scores;
  try {
    scores = JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return jsonResponse({ error: "Could not parse AI response.", raw }, 502);
  }

  return jsonResponse(scores);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const pathname = new URL(request.url).pathname;

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, 400);
    }

    try {
      if (pathname === "/analyze") {
        return await handleAnalyze(body, env);
      } else if (pathname === "/score") {
        return await handleScore(body, env);
      } else {
        return new Response("Not found", { status: 404 });
      }
    } catch (err) {
      console.error("Worker error:", err);
      return jsonResponse({ error: "Internal server error." }, 500);
    }
  },
};
