// Vercel Serverless API for chat - OpenRouter only (Gemini is handled by Puter.js in browser)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  // Gemini is handled by Puter.js in browser - this API is for OpenRouter models only
  if (typeof model === "string" && model.includes("gemini")) {
    return res.status(400).json({
      error: "Gemini models are handled by Puter.js in the browser",
      details: "Use Puter.js for Gemini, Claude, and GPT models. This API is for OpenRouter only.",
    });
  }

  const referer = req.headers.origin || req.headers.referer || process.env.APP_URL || "https://pwnai.vercel.app";
  const safeReferer = String(referer).trim();

  // OpenRouter for non-Gemini models
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY") {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is not set",
        details: "Set OPENROUTER_API_KEY in your environment variables.",
      });
    }

    const openRouterModel = model.includes("/") ? model : `openrouter/${model}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": safeReferer,
        "X-Title": "Pwn AI Chat",
      },
      body: JSON.stringify({
        model: openRouterModel,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return res.status(500).json({
      error: "OpenRouter Error",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
