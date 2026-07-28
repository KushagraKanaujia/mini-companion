-- Run this in Supabase SQL editor to set up your tables

create table if not exists personas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,          -- from your auth provider (e.g. Clerk user id)
  name text not null,
  personality text not null,      -- short blurb describing the persona's voice/vibe
  face_url text,                  -- generated/uploaded avatar image
  voice_id text,                  -- Phase 2: ElevenLabs voice id
  pinned_version_id uuid,         -- if set, user has locked to a specific personality version
  data_sharing_opt_in boolean default false, -- explicit opt-in to use chats for model improvement
  created_at timestamptz default now()
);

-- Every time the persona's underlying personality/system-prompt changes,
-- snapshot it here instead of overwriting. Users can pin an old version
-- so an update never silently changes "who" their companion is.
create table if not exists persona_versions (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  personality text not null,
  change_note text,               -- human-readable "what changed" for the update prompt
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  edited_at timestamptz,          -- set when user edits their own message
  deleted_at timestamptz,         -- soft delete; excluded from context + display
  created_at timestamptz default now()
);

-- Rolling memory summary, updated periodically (not every message)
create table if not exists memory_summaries (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  summary text not null,          -- key facts, people, ongoing situations
  updated_at timestamptz default now()
);

-- Weekly reflections shown in the "Sunday reflection" card
create table if not exists reflections (
  id uuid primary key default gen_random_uuid(),
  persona_id uuid references personas(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[],
  created_at timestamptz default now()
);

create index if not exists idx_messages_persona on messages(persona_id, created_at);
