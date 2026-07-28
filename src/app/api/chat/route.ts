import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildSystemPrompt,
  getPersona,
  getEffectivePersonality,
  getMemorySummary,
  getRecentMessages,
  saveMessage,
  updateMemorySummary,
} from "@/lib/companion";
import { ollamaGenerateStream, isOllamaAvailable } from "@/lib/ollama";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const USE_OLLAMA = process.env.USE_OLLAMA === "true";

export async function POST(req: Request) {
  const { personaId, message } = await req.json();

  if (!personaId || !message) {
    return new Response("Missing personaId or message", { status: 400 });
  }

  const persona = await getPersona(personaId);
  if (!persona) return new Response("Persona not found", { status: 404 });

  const memorySummary = await getMemorySummary(personaId);
  const history = await getRecentMessages(personaId, 8); // Reduced for faster responses
  const effectivePersonality = await getEffectivePersonality(persona);

  await saveMessage(personaId, "user", message);

  const systemPrompt = buildSystemPrompt({ ...persona, personality: effectivePersonality }, memorySummary);

  try {
    // Decide which AI to use: Ollama (local) or Gemini (cloud)
    if (USE_OLLAMA) {
      return await handleOllamaChat(personaId, message, systemPrompt, history);
    } else {
      return await handleGeminiChat(personaId, message, systemPrompt, history);
    }
  } catch (error: any) {
    console.error("AI error:", error);
    const errorMessage = error?.message || "Failed to get response from AI";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: error?.status || 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Ollama (local, unlimited, free)
async function handleOllamaChat(
  personaId: string,
  message: string,
  systemPrompt: string,
  history: any[]
) {
  // Check if Ollama is running
  const ollamaAvailable = await isOllamaAvailable();
  if (!ollamaAvailable) {
    throw new Error("Ollama is not running. Start it with: brew services start ollama");
  }

  const chatHistory = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await ollamaGenerateStream(systemPrompt, chatHistory, message);
  let fullReply = "";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n").filter((l) => l.trim());

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                const chunk = json.message.content;
                fullReply += chunk;
                controller.enqueue(encoder.encode(chunk));
              }
            } catch {}
          }
        }

        await saveMessage(personaId, "assistant", fullReply);

        // Update memory every ~20 messages
        const count = history.length + 2;
        if (count % 20 === 0) {
          updateMemorySummary(personaId).catch(console.error);
        }

        controller.close();
      } catch (err: any) {
        console.error("Ollama streaming error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Gemini (cloud, quotas, costs)
async function handleGeminiChat(
  personaId: string,
  message: string,
  systemPrompt: string,
  history: any[]
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    systemInstruction: systemPrompt,
  });

  const chatHistory = history.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({
    history: chatHistory,
  });

  // Retry logic for 503 and 429 errors
  let result;
  let retries = 3;
  while (retries > 0) {
    try {
      result = await chat.sendMessageStream(message);
      break;
    } catch (err: any) {
      // Handle quota exceeded (429) with friendly message
      if (err.status === 429) {
        throw new Error("Daily API quota exceeded. Switch to Ollama mode (USE_OLLAMA=true) for unlimited free chat, or get a new Gemini API key at https://aistudio.google.com/app/apikey");
      }
      // Retry on 503 (service unavailable)
      if (err.status === 503 && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        retries--;
        continue;
      }
      throw err;
    }
  }

  let fullReply = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullReply += chunkText;
          controller.enqueue(encoder.encode(chunkText));
        }

        await saveMessage(personaId, "assistant", fullReply);

        const count = history.length + 2;
        if (count % 20 === 0) {
          updateMemorySummary(personaId).catch(console.error);
        }

        controller.close();
      } catch (err: any) {
        console.error("Gemini streaming error:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
