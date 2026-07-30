# Mini Companion

A modern AI companion app with persistent memory and natural conversations. Built with Next.js, Supabase, and local AI models.

## Features

- 💬 **Natural texting** - Responds like a real person, not a chatbot
- 🧠 **Long-term memory** - Remembers past conversations
- 🎭 **Customizable personality** - Adjust flirty, funny, supportive, and deep traits
- 🎯 **Multiple modes** - Casual, Vent, Playful, and Advice modes
- 🎤 **Voice calling** - Real-time voice conversations with live transcription
- 📹 **Video bubbles** - See yourself during voice calls
- 💾 **Data export** - Download all your data as JSON
- 🔒 **Privacy-first** - Use local AI models (Ollama) for unlimited free chat

## Tech Stack

- **Frontend**: Next.js 16, React, TailwindCSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI Models**: Ollama (llama3.2:1b for fast responses) or Gemini Flash
- **Voice**: Browser Web Speech API (free, unlimited)
- **Styling**: Custom purple/pink gradient theme with glassmorphism

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Run the schema:
   - Go to SQL Editor
   - Paste contents of `supabase-schema.sql`
   - Execute
3. Get your credentials:
   - Project Settings → API
   - Copy URL, anon key, and service role key

### 3. Setup Ollama (Recommended for Free Usage)
```bash
# Install Ollama
brew install ollama

# Start Ollama service
brew services start ollama

# Pull the fast model
ollama pull llama3.2:1b
```

### 4. Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Optional: Use Ollama (recommended) or Gemini
USE_OLLAMA=true
GOOGLE_GEMINI_API_KEY=your_key_if_not_using_ollama
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Usage

1. **Create a companion** - Click "Create New Companion" on the home page
2. **Customize personality** - Use the sliders to adjust traits
3. **Choose a mode** - Pick between Casual, Vent, Playful, or Advice
4. **Start chatting** - Text naturally like you would with a friend
5. **Voice call** - Click "Video Call" for real-time voice chat
6. **Set moods** - Use the eye icon for quick mood actions

## Project Structure

```
mini-companion/
├── src/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── chat/         # Chat interface
│   │   ├── create/       # Companion creation
│   │   └── page.tsx      # Home page
│   └── lib/
│       ├── companion.ts  # Core logic & prompts
│       ├── ollama.ts     # Ollama integration
│       └── supabase.ts   # Database client
├── public/               # Static assets
└── supabase-schema.sql  # Database schema
```

## Key Files

- **`src/lib/companion.ts`** - System prompts, memory management, persona logic
- **`src/app/api/chat/route.ts`** - Streaming chat endpoint with Ollama/Gemini
- **`src/app/chat/[personaId]/page.tsx`** - Main chat UI with voice/video
- **`src/lib/ollama.ts`** - Local AI model integration

## Features in Detail

### Personality System
Adjust 4 core traits (0-100%):
- 😘 **Flirty** - Playful and charming
- 😂 **Funny** - Jokes and humor
- 💜 **Supportive** - Caring and validating
- 🤔 **Deep** - Thoughtful questions

### Conversation Modes
- 💬 **Casual** - Light, fun chatting
- 💭 **Vent** - Supportive listening
- 🎮 **Playful** - Games and jokes
- 💡 **Advice** - Thoughtful guidance

### Voice Features
- Real-time speech recognition
- Natural interruption support
- Live transcription display
- Browser-based (no API costs)

## Performance

- **Response time**: ~1-2 seconds with llama3.2:1b
- **Memory**: Only last 8 messages + summary for speed
- **Cost**: $0 with Ollama, minimal with Gemini Flash

## Deployment

### Vercel
```bash
vercel deploy
```

Set environment variables in Vercel dashboard.

### Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `USE_OLLAMA=false` (Vercel can't run Ollama)
- `GOOGLE_GEMINI_API_KEY` (for cloud deployment)

## License

MIT

## Contributing

Pull requests welcome! Please open an issue first to discuss changes.
