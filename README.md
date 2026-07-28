# Mini Companion — Phase 1 (Text MVP)

A persistent AI companion: text chat + long-term memory. This is the
foundation — voice (Phase 2) and video avatar calling (Phase 3) plug
into the same backend later.

## What's here

- `src/lib/companion.ts` — the actual product: persona system prompt,
  memory summary logic, message storage. Tune this file most.
- `src/app/api/chat/route.ts` — streaming chat endpoint (Claude API)
- `src/app/chat/[personaId]/page.tsx` — chat UI
- `supabase-schema.sql` — run this in your Supabase project first

## Setup (15-20 min)

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Supabase project** (free tier) at supabase.com
   - Go to SQL Editor -> paste `supabase-schema.sql` -> run it
   - Go to Project Settings -> API -> copy your URL, anon key, and
     service role key

3. **Get an Anthropic API key** at console.anthropic.com

4. **Copy `.env.example` to `.env.local`** and fill in the values

5. **Create a test persona** — for now, insert one manually via
   Supabase's Table Editor (personas table): give it a name and a
   personality blurb. Copy its `id`.

6. **Run it**
   ```
   npm run dev
   ```
   Visit `http://localhost:3000/chat/<paste-persona-id-here>`

## What's NOT built yet (by design — this is v0)

- No persona creation UI (add via Supabase table editor for now)
- No auth (every visitor to a persona URL can chat as if they're the
  owner — fine for testing, not for public launch)
- No face/avatar image yet
- No voice or video calling (Phase 2/3)

## Next steps once this works

1. Add a persona creation page (name + personality + generated face
   image via fal.ai or Replicate)
2. Add Clerk auth so personas are actually tied to real users
3. Add the weekly reflection generator (same pattern as
   `updateMemorySummary` in `companion.ts`, but summarizing a week
   instead of 40 messages)
4. Deploy to Vercel, connect a domain, start sharing

## New in this version

- **Version pinning** — `updatePersonalityWithVersioning()` in `companion.ts` snapshots a persona's old personality before any update, so a product-wide change never silently alters an existing companion. Wire a "pin this version" button to `pinVersion()` when you build the settings UI.
- **Message edit/delete** — soft-delete + edit endpoints at `/api/messages/[id]`. Note: the current chat UI doesn't yet load message IDs from history on page load, so edit/delete only works within the same live session for now — wiring persisted history load-in with IDs is the next small task.
- **Transparent memory viewer** — click "memory" in the chat header to see exactly what the companion currently remembers.
- **Full data export** — click "export" in the chat header to download persona + memory + full message history as JSON.

## Known gaps to close next

- Chat page doesn't load prior message history on refresh yet (starts blank each visit) — needs a `GET /api/persona/[id]/messages` route + initial fetch in `useEffect`.
- No UI yet for the "pin version" choice when an update happens — currently just the backend logic.
