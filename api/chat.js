// Vercel Serverless API for chat
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, model } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages format' });
  }

  const referer = req.headers.origin || req.headers.referer || process.env.APP_URL || "https://pwnai.vercel.app";
  const safeReferer = String(referer).trim();

  // 1) Gemini route via Google SDK
  if (typeof model === "string" && model.includes("gemini")) {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY") {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not set",
          details: "Set GEMINI_API_KEY in your environment variables.",
        });
      }

      const genAI = new GoogleGenerativeAI(geminiKey);
      const geminiModelId = "gemini-2.0-flash";
      const geminiModel = genAI.getGenerativeModel({ model: geminiModelId });

      const prompt = messages[messages.length - 1].content;
      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const chat = geminiModel.startChat({ history });
      const result = await chat.sendMessage(prompt);
      const responseText = result.response.text();

      return res.json({
        choices: [{ message: { role: "assistant", content: responseText } }],
      });
    } catch (error) {
      console.error("Gemini SDK Error:", error);
      return res.status(500).json({
        error: "Gemini SDK Error",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // 2) OpenRouter fallback
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
