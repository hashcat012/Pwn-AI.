import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listenWithFallback(app: express.Express, startPort: number) {
  let port = startPort;
  while (port < startPort + 50) {
    const server = await new Promise<import("http").Server>((resolve, reject) => {
      const s = app.listen(port, "0.0.0.0", () => resolve(s));
      s.on("error", (err: any) => reject(err));
    }).catch((err: any) => {
      if (err?.code === "EADDRINUSE") return null;
      throw err;
    });

    if (server) {
      return { server, port };
    }

    port += 1;
  }

  throw new Error(`Unable to find an available port starting at ${startPort}`);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API routes
  app.post("/api/chat", async (req, res) => {
    const { messages, model } = req.body;
    const referer =
      (typeof req.headers.origin === "string" && req.headers.origin) ||
      (typeof req.headers.referer === "string" && req.headers.referer) ||
      process.env.APP_URL ||
      "http://localhost:3000";
    
    // Safety: ensure no extra whitespace in referer
    const safeReferer = String(referer).trim();
    
    // 1) Gemini route via Google SDK (requires GEMINI_API_KEY)
    if (typeof model === "string" && model.includes("gemini")) {
      try {
        console.log("Attempting Gemini via Google SDK...");
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey || geminiKey === "YOUR_GEMINI_API_KEY") {
          return res.status(500).json({
            error: "GEMINI_API_KEY is not set",
            details: "Set GEMINI_API_KEY in your .env to use Gemini (Google AI Studio).",
          });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModelId = "gemini-2.0-flash";
        const geminiModel = genAI.getGenerativeModel({ model: geminiModelId });

        const prompt = messages[messages.length - 1].content;
        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

        const chat = geminiModel.startChat({ history });
        const result = await chat.sendMessage(prompt);
        const responseText = result.response.text();

        return res.json({
          choices: [
            {
              message: {
                role: "assistant",
                content: responseText,
              },
            },
          ],
        });
      } catch (error) {
        console.error("Gemini SDK Error:", error);
        return res.status(500).json({
          error: "Gemini SDK Error",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // 2. Handle via OpenRouter (Fallback or other models)
    let apiKey = process.env.OPENROUTER_API_KEY;
    const hardcodedKey = "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";
    
    if (!apiKey || apiKey === "MY_OPENROUTER_API_KEY" || apiKey.length < 10) {
      apiKey = hardcodedKey;
    }

    if (!apiKey) {
      return res.status(500).json({ error: "OPENROUTER_API_KEY is not set" });
    }

    try {
      let targetModel = model || "openai/gpt-oss-120b:free";
      
      // Map user-requested IDs to verified OpenRouter IDs
      const modelMapping: Record<string, string> = {
        // Legacy/previous incorrect IDs -> official current IDs
        "nvidia/nemotron-4-340b-instruct:free": "nvidia/nemotron-3-super-120b-a12b:free",
        "zhipu/glm-4-9b-chat:free": "z-ai/glm-4.5-air:free",
        "sophosympatheia/rogue-rose-103b-v0.2:free": "openai/gpt-oss-120b:free",
        "minimax/minimax-abab6.5s:free": "minimax/minimax-m2.5:free",
      };

      if (modelMapping[targetModel]) {
        console.log(`Mapping ${targetModel} to ${modelMapping[targetModel]}`);
        targetModel = modelMapping[targetModel];
      }

      console.log(`Calling OpenRouter with model: ${targetModel}`);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json",
          "HTTP-Referer": safeReferer,
          "X-Title": "Pwn AI",
        },
        body: JSON.stringify({
          model: targetModel,
          messages: messages,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("OpenRouter API Error Response:", JSON.stringify(data, null, 2));
        return res.status(response.status).json({ 
          error: "OpenRouter API Error", 
          details: data.error?.message || JSON.stringify(data) 
        });
      }

      res.json(data);
    } catch (error) {
      console.error("OpenRouter Fetch Error:", error);
      res.status(500).json({ error: "Failed to fetch from OpenRouter", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        strictPort: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const { port } = await listenWithFallback(app, PORT);
  console.log(`Server running on http://localhost:${port}`);
}

startServer();
