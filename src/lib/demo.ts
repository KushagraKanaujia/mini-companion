"use client";

// Demo mode: lets anyone try Mini Companion with zero setup (no Supabase,
// no Ollama, no API keys). It patches window.fetch so the app's own
// /api/* calls are answered in the browser:
//   - companions + messages are stored in this browser's localStorage
//   - replies come from a small scripted responder (NOT an LLM) that
//     follows the same texting style rules as the real system prompt
//
// Demo mode is on when NEXT_PUBLIC_DEMO_MODE=true, or automatically when
// NEXT_PUBLIC_SUPABASE_URL is not set at build time.

export const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_SUPABASE_URL;

type DemoPersona = {
  id: string;
  user_id: string;
  name: string;
  personality: string;
  face_url: string | null;
  voice_id: string | null;
  created_at: string;
};

type DemoMessage = {
  id: string;
  persona_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

const KEY = "mini-companion-demo-v1";
const VIBE_MARKER = "\n\nCURRENT VIBE SETTINGS:";

type Store = { personas: DemoPersona[]; messages: DemoMessage[] };

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {}
  return { personas: [], messages: [] };
}

function save(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {}
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---------- scripted responder ----------

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

type Vibe = {
  mode: string;
  flirty: number;
  funny: number;
  supportive: number;
  deep: number;
};

function parseVibe(raw: string): Vibe {
  const num = (label: string, d: number) => {
    const m = raw.match(new RegExp(`${label}: (\\d+)%`));
    return m ? Number(m[1]) : d;
  };
  const modeLine = raw.match(/Mode: ([^\n]+)/)?.[1] ?? "";
  const mode = modeLine.startsWith("they need to vent")
    ? "vent"
    : modeLine.startsWith("they wanna have fun")
    ? "playful"
    : modeLine.startsWith("they want actual advice")
    ? "advice"
    : "casual";
  return {
    mode,
    flirty: num("Flirty", 30),
    funny: num("Funny", 50),
    supportive: num("Supportive", 70),
    deep: num("Deep", 40),
  };
}

function scriptedReply(persona: DemoPersona, rawMessage: string, turn: number): string {
  const vibe = parseVibe(rawMessage);
  const text = rawMessage.split(VIBE_MARKER)[0].toLowerCase().trim();
  // Match whole words (short ones) or word prefixes (e.g. "frustrat") so "hi" doesn't match "this".
  const has = (...words: string[]) =>
    words.some((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${esc}${w.length <= 3 ? "\\b" : ""}`).test(text);
    });

  let reply: string;

  if (has("fail", "sad", "down", "lonely", "depress", "cry", "crying", "bad day", "rough")) {
    reply = pick([
      "nooo im so sorry :( *gives u a hug* wanna talk about it?",
      "ugh that really sucks. im here tho, what happened?",
      "aw no. u dont have to be ok rn. tell me whats going on?",
    ]);
  } else if (has("frustrat", "angry", "mad", "annoyed", "ugh", "hate")) {
    reply = pick([
      "ugh ok that sounds so annoying. who do i need to fight lol",
      "wait what happened?? vent away im listening",
      "nah thats valid to be mad about tbh. tell me everything",
    ]);
  } else if (has("tired", "sleepy", "exhausted")) {
    reply = pick([
      "same ngl lol. did u sleep at all last night?",
      "*makes u coffee* long day?",
      "rest is productive too fr. what wore u out?",
    ]);
  } else if (has("excited", "hyped", "yay", "omg", "got the", "passed", "won")) {
    reply = pick([
      "WAIT WHAT omg tell me everything!!",
      "yesss im so happy for u!! *does a little dance*",
      "AHHH thats huge. how do u feel??",
    ]);
  } else if (turn === 0 && has("hi", "hey", "hello", "yo", "sup", "hii")) {
    reply = pick([
      `heyyy omg hi!! im ${persona.name.toLowerCase()} :) hows ur day going?`,
      `hiii finally someone to talk to lol. whats up?`,
      `hey you! *waves* how r u doing rn?`,
    ]);
  } else if (has("hi", "hey", "hello", "sup")) {
    reply = pick(["heyy whats up", "hii :) whats new", "yo! hows it going"]);
  } else if (has("who are you", "about you", "tell me about", "what do you like", "ur hobbies", "your hobbies")) {
    reply = `lol ok so im ${persona.name.toLowerCase()}. ${firstSentence(persona.personality).toLowerCase()} ur turn tho, tell me something random about u`;
  } else if (has("thank", "thx", "ty")) {
    reply = pick(["anytime :) fr", "ofc!! thats what im here for", "aw stop ur gonna make me blush lol"]);
  } else if (has("im a guy", "im a girl", "i'm a guy", "i'm a girl")) {
    reply = "oh got it lol mb, noted";
  } else if (has("joke", "funny", "bored", "game")) {
    reply = pick([
      "ok would u rather: fight 1 horse sized duck or 100 duck sized horses",
      "two truths and a lie, go. ill guess",
      "why did the scarecrow win an award... bc he was outstanding in his field. ok ill see myself out lol",
    ]);
  } else if (has("advice", "should i", "what do i do", "help me", "can u", "can you")) {
    reply = pick([
      "ok yeah im down to help. whats the situation exactly?",
      "hmm ok. whats ur gut telling u?",
      "yeah what do u need? walk me thru it",
    ]);
  } else if (text.endsWith("?")) {
    reply = pick([
      "hmm good question lol. honestly idk, what do u think?",
      "ooh ok let me think... depends tbh. why do u ask?",
      "lowkey yes?? but im curious why u ask",
    ]);
  } else {
    reply = pick([
      "wait tell me more",
      "ok and how do u feel about that",
      "lol fr. then what happened?",
      "omg ok im listening",
      "ngl thats kinda interesting. say more",
    ]);
  }

  // Vibe sliders + mode nudge the reply, like they nudge the real model.
  if (vibe.mode === "vent" && !reply.includes("?")) reply += " im listening, take ur time";
  if (vibe.mode === "advice" && Math.random() < 0.5) reply += " one small step at a time tho";
  if (vibe.funny > 60 && Math.random() < 0.5) reply += " lmao";
  if (vibe.supportive > 75 && Math.random() < 0.3) reply += " *sits next to u*";
  if (vibe.deep > 65 && Math.random() < 0.5) reply += " also... what does that mean to u, deep down?";
  if (vibe.flirty > 65 && Math.random() < 0.4) reply += " ;)";

  return reply;
}

function firstSentence(s: string) {
  const m = s.match(/^[^.!?]+[.!?]/);
  return m ? m[0] : s;
}

function streamText(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,4}/g) ?? [text];
  const body = new ReadableStream({
    async start(controller) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500)); // "typing..."
      for (const c of chunks) {
        controller.enqueue(encoder.encode(c));
        await new Promise((r) => setTimeout(r, 25));
      }
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function demoPersonality(name: string, traits: Record<string, unknown>): string {
  const type = (traits.personalityType as string) || "Warm & Nurturing";
  const style = (traits.speakingStyle as string) || "Casual & Friendly";
  const interests = (traits.interests as string[]) ?? [];
  const rel = (traits.relationshipType as string) || "friend";
  const backstory = (traits.backstory as string) || "";
  return `${name} is a ${type.toLowerCase()} ${rel} with a ${style.toLowerCase()} way of talking.${
    interests.length ? ` They light up when the conversation turns to ${interests.slice(0, 3).join(", ").toLowerCase()}.` : ""
  }${backstory ? ` ${backstory.trim()}` : ""} They listen closely, remember the little things, and reply like a real friend texting back. (Demo mode: this description was assembled from your choices, not generated by an AI model.)`;
}

// ---------- fetch interceptor ----------

async function handle(url: URL, init: RequestInit | undefined): Promise<Response | null> {
  const method = (init?.method ?? "GET").toUpperCase();
  const path = url.pathname;
  const body = () => (init?.body ? JSON.parse(String(init.body)) : {});
  const store = load();

  if (path === "/api/personas" && method === "GET") {
    const userId = url.searchParams.get("user_id");
    const personas = store.personas
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return json({ personas });
  }

  if (path === "/api/personas" && method === "POST") {
    const { user_id, name, personality, face_url, voice_id } = body();
    if (!user_id || !name || !personality) return json({ error: "Missing required fields" }, 400);
    const p: DemoPersona = {
      id: uid(),
      user_id,
      name,
      personality,
      face_url: face_url || null,
      voice_id: voice_id || null,
      created_at: new Date().toISOString(),
    };
    store.personas.push(p);
    save(store);
    return json(p, 201);
  }

  if (path === "/api/chat" && method === "POST") {
    const { personaId, message } = body();
    const persona = store.personas.find((p) => p.id === personaId);
    if (!persona) return new Response("Persona not found", { status: 404 });
    const live = store.messages.filter((m) => m.persona_id === personaId && !m.deleted_at);
    const turn = live.filter((m) => m.role === "user").length;
    const now = new Date().toISOString();
    store.messages.push({
      id: uid(),
      persona_id: personaId,
      role: "user",
      content: String(message).split(VIBE_MARKER)[0],
      created_at: now,
      edited_at: null,
      deleted_at: null,
    });
    const reply = scriptedReply(persona, String(message), turn);
    store.messages.push({
      id: uid(),
      persona_id: personaId,
      role: "assistant",
      content: reply,
      created_at: new Date(Date.now() + 1).toISOString(),
      edited_at: null,
      deleted_at: null,
    });
    save(store);
    return streamText(reply);
  }

  const personaRoute = path.match(/^\/api\/persona\/([^/]+)\/(messages|memory|export)$/);
  if (personaRoute) {
    const [, personaId, kind] = personaRoute;
    const msgs = store.messages
      .filter((m) => m.persona_id === personaId && !m.deleted_at)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    if (kind === "messages") return json({ messages: msgs.slice(-100) });
    const userLines = msgs.filter((m) => m.role === "user").slice(-5).map((m) => `- they said: "${m.content}"`);
    const summary = userLines.length
      ? `Demo mode memory (the real app writes an AI summary every ~20 messages):\n${userLines.join("\n")}`
      : null;
    if (kind === "memory") return json({ summary, messageCount: msgs.length });
    return json(
      {
        exported_at: new Date().toISOString(),
        persona: store.personas.find((p) => p.id === personaId) ?? null,
        memory_summary: summary,
        messages: msgs.map(({ role, content, created_at }) => ({ role, content, created_at })),
      }
    );
  }

  const msgRoute = path.match(/^\/api\/messages\/([^/]+)$/);
  if (msgRoute) {
    const m = store.messages.find((x) => x.id === msgRoute[1]);
    if (m && method === "DELETE") m.deleted_at = new Date().toISOString();
    if (m && method === "PATCH" && m.role === "user") {
      m.content = body().content;
      m.edited_at = new Date().toISOString();
    }
    save(store);
    return json({ ok: true });
  }

  if (path === "/api/generate-personality" && method === "POST") {
    const { name, traits } = body();
    await new Promise((r) => setTimeout(r, 600));
    return json({ personality: demoPersonality(name || "Your companion", traits || {}) });
  }

  if (path === "/api/voices") return json({ voices: [] });

  if (path === "/api/generate-image") {
    return json({ error: "Image generation is turned off in the demo. Pick one from the gallery or upload a photo." }, 400);
  }

  return null; // /api/templates and /api/avatars are static and served by Next.js
}

let installed = false;

export function installDemoFetch() {
  if (installed || typeof window === "undefined" || !DEMO_MODE) return;
  installed = true;
  const realFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const url = new URL(raw, window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) {
        const res = await handle(url, init);
        if (res) return res;
      }
    } catch (err) {
      console.error("[demo] handler error", err);
      return json({ error: "Demo mode error" }, 500);
    }
    return realFetch(input, init);
  };
}

export function resetDemoData() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
