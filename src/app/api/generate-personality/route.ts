import { GoogleGenerativeAI } from "@google/generative-ai";
import { ollamaGenerate } from "@/lib/ollama";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const USE_OLLAMA = process.env.USE_OLLAMA === "true";

export async function POST(req: Request) {
  try {
    const { name, traits } = await req.json();

    const prompt = `Create a detailed personality description for an AI companion named ${name}.

Character traits selected:
${JSON.stringify(traits, null, 2)}

Generate a natural, conversational personality description (2-3 sentences) that captures:
- Their speaking style and tone
- Key personality traits
- How they interact with people
- What makes them unique

Keep it conversational and authentic, not robotic. Write in third person.`;

    let personality: string;

    if (USE_OLLAMA) {
      personality = await ollamaGenerate(prompt);
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      personality = response.text();
    }

    return new Response(JSON.stringify({ personality }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error generating personality:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
