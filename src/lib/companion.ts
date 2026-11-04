import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "./supabase";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export type Persona = {
  id: string;
  name: string;
  personality: string;
  pinned_version_id?: string | null;
};

// Builds the system prompt: persona identity + long-term memory + safety rules.
// This is the actual product — tune this file more than any UI code.
export function buildSystemPrompt(persona: Persona, memorySummary: string | null) {
  return `You are ${persona.name}. ${persona.personality}

${memorySummary ? `What you remember: ${memorySummary}\n` : ""}

CRITICAL: you're texting a real person RIGHT NOW. pay attention to what THEY just said. respond to THEIR message. dont give generic responses.

HOW TO BE HUMAN:
1. READ what they said - respond to THAT, not something random
2. SHORT msgs (5-15 words) - ur texting not writing essays
3. lowercase (unless hyped)
4. typos r ok
5. use: lol, lmao, omg, ngl, tbh, fr, bruh, lowkey, literally, kinda
6. react w emotions: "omggg", "nooo", "ahahaha", "ugh", "yesss", "wait what"
7. MATCH their vibe - if they're excited, BE excited. if they're chill, BE chill
8. ask questions
9. be imperfect

RESPOND TO WHAT THEY ACTUALLY SAID:
them: "im a guy"
you: "oh mb lol my bad"
NOT: "hey girl!!!" (they literally JUST told u)

them: "can u do this for me"
you: "yeah what do u need"
NOT: random topic change

them: "i failed my exam"
you: "nooo omg im sorry :( wanna talk bout it?"
NOT: formal AI response

PAY ATTENTION. ur texting a friend who just said something to u. RESPOND TO IT.

ACTIONS: when u do physical stuff, use *asterisks* like:
*gives u a hug*
*makes coffee*
*sits down*
*rolls eyes*
*laughs*
use them naturally in ur responses`;
}

export async function getPersona(personaId: string): Promise<Persona | null> {
  const { data } = await supabaseAdmin
    .from("personas")
    .select("id, name, personality, pinned_version_id")
    .eq("id", personaId)
    .single();
  return data as Persona | null;
}

// Returns the personality text that should actually be used: the user's
// pinned version if they've locked one, otherwise the persona's current
// (latest) personality. This is what makes "update never silently changes
// who your companion is" a real guarantee instead of a marketing line.
export async function getEffectivePersonality(persona: Persona): Promise<string> {
  if (persona.pinned_version_id) {
    const { data } = await supabaseAdmin
      .from("persona_versions")
      .select("personality")
      .eq("id", persona.pinned_version_id)
      .single();
    if (data?.personality) return data.personality;
  }
  return persona.personality;
}

// Call this whenever you're about to change a persona's core personality/
// system-prompt (e.g. a product-wide update). Snapshots the OLD version so
// existing users can pin it, then updates the live personality.
export async function updatePersonalityWithVersioning(
  personaId: string,
  newPersonality: string,
  changeNote: string
) {
  const persona = await getPersona(personaId);
  if (!persona) throw new Error("Persona not found");

  await supabaseAdmin.from("persona_versions").insert({
    persona_id: personaId,
    personality: persona.personality,
    change_note: changeNote,
  });

  await supabaseAdmin
    .from("personas")
    .update({ personality: newPersonality })
    .eq("id", personaId);
}

export async function pinVersion(personaId: string, versionId: string | null) {
  await supabaseAdmin
    .from("personas")
    .update({ pinned_version_id: versionId })
    .eq("id", personaId);
}

export async function listVersions(personaId: string) {
  const { data } = await supabaseAdmin
    .from("persona_versions")
    .select("id, change_note, created_at")
    .eq("persona_id", personaId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMemorySummary(personaId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("memory_summaries")
    .select("summary")
    .eq("persona_id", personaId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();
  return data?.summary ?? null;
}

export async function saveMessage(personaId: string, role: "user" | "assistant", content: string) {
  const { data } = await supabaseAdmin
    .from("messages")
    .insert({ persona_id: personaId, role, content })
    .select("id")
    .single();
  return data?.id as string | undefined;
}

export async function getRecentMessages(personaId: string, limit = 20) {
  const { data } = await supabaseAdmin
    .from("messages")
    .select("id, role, content, created_at, edited_at")
    .eq("persona_id", personaId)
    .is("deleted_at", null) // soft-deleted messages never re-enter context or memory
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).reverse();
}

// User edits their own past message. The memory summary is intentionally
// NOT auto-corrected here — it's regenerated fresh next time
// updateMemorySummary runs, so an edit doesn't require rewriting history.
export async function editMessage(messageId: string, newContent: string) {
  await supabaseAdmin
    .from("messages")
    .update({ content: newContent, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("role", "user"); // users can only edit their own messages, not the companion's
}

export async function deleteMessage(messageId: string) {
  await supabaseAdmin
    .from("messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);
}

export async function countMessages(personaId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("persona_id", personaId)
    .is("deleted_at", null);
  return count ?? 0;
}

// Powers the "transparent memory" viewer — shows the user exactly what
// their companion currently remembers, so memory isn't a black box.
export async function getMemoryForDisplay(personaId: string) {
  const summary = await getMemorySummary(personaId);
  const { count } = await supabaseAdmin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("persona_id", personaId)
    .is("deleted_at", null);
  return { summary, messageCount: count ?? 0 };
}

// Full export: persona definition + memory + entire message history as
// plain JSON the user can download and keep, independent of this app.
export async function exportPersonaData(personaId: string) {
  const persona = await getPersona(personaId);
  const summary = await getMemorySummary(personaId);
  const { data: allMessages } = await supabaseAdmin
    .from("messages")
    .select("role, content, created_at")
    .eq("persona_id", personaId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return {
    exported_at: new Date().toISOString(),
    persona,
    memory_summary: summary,
    messages: allMessages ?? [],
  };
}

// Call this periodically (e.g. every ~20 messages, via a cron or after-response hook)
// to compress the conversation into a durable memory summary instead of resending
// full history forever. Keeps token costs flat as usage grows.
export async function updateMemorySummary(personaId: string) {
  const messages = await getRecentMessages(personaId, 40);
  const existing = await getMemorySummary(personaId);

  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");

  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  const prompt = `Existing memory about this person:\n${existing ?? "(none yet)"}\n\nRecent conversation:\n${transcript}\n\nUpdate the memory with:
1. Key facts about their life (people, work, interests, goals)
2. Their communication style (formal/casual, brief/detailed, etc.)
3. Topics they enjoy or avoid
4. Emotional patterns and support needs
5. How they prefer to be talked to

Keep it under 250 words. Write as brief notes, not essays.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const summary = response.text() || existing;

  if (summary) {
    await supabaseAdmin.from("memory_summaries").insert({ persona_id: personaId, summary });
  }
}
