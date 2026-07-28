// Ollama local AI integration for unlimited free chat

export async function ollamaGenerateStream(
  systemPrompt: string,
  chatHistory: Array<{ role: string; content: string }>,
  newMessage: string
) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:1b", // Using 1b for faster responses
      messages: [
        { role: "system", content: systemPrompt },
        ...chatHistory.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: newMessage },
      ],
      stream: true,
      options: {
        temperature: 0.9, // More creative/natural
        top_p: 0.95,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  return response;
}

export async function ollamaGenerate(prompt: string): Promise<string> {
  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2:1b",
      prompt,
      stream: false,
      options: {
        temperature: 0.9,
        top_p: 0.95,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.response;
}

// Check if Ollama is available and running
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    return response.ok;
  } catch {
    return false;
  }
}
