# AI Services Integration Roadmap

## 🎯 Recommended AI Services to Make This Better Than Nomi

### **Currently Integrated** ✅
1. **Anthropic Claude** (Chat)
   - Best-in-class conversation quality
   - Long context windows
   - Strong memory/reasoning

2. **Supabase** (Database + Storage)
   - Real-time capabilities
   - File storage
   - PostgreSQL database

### **Should Add Next** 🚀

---

## 1. **ElevenLabs** (Voice) - Priority: HIGH
**What it does:** Ultra-realistic AI voice generation

**Why add it:**
- Nomi has voice chat - you need it too
- Makes companions feel WAY more real
- ElevenLabs has the best quality

**Features to build:**
- 🎙️ **Voice messages** - User sends voice, AI responds with voice
- 📞 **Voice calls** - Real-time voice conversation
- 🔊 **Read messages aloud** - Click any message to hear it

**API:**
```javascript
// Text-to-speech
const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID', {
  method: 'POST',
  headers: {
    'xi-api-key': process.env.ELEVENLABS_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: "Hey, how are you feeling today?",
    model_id: "eleven_multilingual_v2"
  })
});
```

**Cost:** $5/mo (30k characters) → $99/mo (2M characters)

**Your API key:** Already have it! (`sk_a31699d2a80785cfb0fe49caaaa4feaa72d8e56890268c71`)

---

## 2. **OpenAI Realtime API** (Voice Conversations) - Priority: HIGH
**What it does:** Real-time voice-to-voice conversations (like talking to ChatGPT)

**Why add it:**
- Future of AI companions
- Instant, natural conversations
- No text intermediary

**Use case:**
- Press and hold to talk
- AI responds instantly with voice
- Feels like calling a real person

**API:** WebSocket-based
```javascript
const ws = new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17');
```

**Cost:** $5 per million input tokens, $20 per million output tokens

**When to add:** After ElevenLabs basic voice is working

---

## 3. **Whisper API** (Speech-to-Text) - Priority: MEDIUM
**What it does:** Convert user voice messages to text

**Why add it:**
- Paired with ElevenLabs for full voice support
- OpenAI's Whisper is the gold standard
- Supports 99 languages

**Use case:**
- User records voice message
- Whisper transcribes it
- Claude responds
- ElevenLabs reads response

**API:**
```javascript
const formData = new FormData();
formData.append('file', audioFile);
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
  body: formData
});
```

**Cost:** $0.006 per minute

---

## 4. **Stable Diffusion (via Replicate)** - Priority: MEDIUM
**What it does:** Generate images inside the chat

**Why add it:**
- "Show me what your day looked like"
- "Draw me as an anime character"
- Interactive visual experiences

**Fix your current issue:**
Your Replicate key might be wrong. Here's how to test:
```bash
curl https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer r8_0w6IcotipeArNLetB3gEEK3vRjqT3tB3qW1SF" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "input": {"prompt": "test"}
  }'
```

If that fails (401), regenerate your key at https://replicate.com/account/api-tokens

**Cost:** ~$0.01 per image

---

## 5. **Anthropic Vision** (Image Understanding) - Priority: LOW
**What it does:** Claude can see and understand images

**Why add it:**
- User shares photos, AI comments on them
- "What do you think of my outfit?"
- More personal, visual conversations

**Already have it!** Claude Sonnet 4 supports vision:
```javascript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-6",
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "url", url: imageUrl } },
      { type: "text", text: "What do you see in this image?" }
    ]
  }]
});
```

**Cost:** Included in Claude API pricing

---

## 6. **Pinecone** (Semantic Memory) - Priority: LOW
**What it does:** Vector database for smarter, semantic memory search

**Why add it:**
- Current memory is simple text summaries
- Pinecone lets you search "tell me about that restaurant we talked about last week"
- Much more powerful memory recall

**When to add:** After you have 100+ users (overkill for now)

**Cost:** Free tier available, then $70/mo

---

## 7. **LangChain** (Memory Management) - Priority: LOW
**What it does:** Framework for better conversation memory

**Why maybe skip it:**
- You already have good memory in companion.ts
- Adds complexity
- Your custom solution is simpler

---

## 8. **Clerk** (User Auth) - Priority: HIGH
**What it does:** User authentication and management

**Why add it:**
- Right now anyone with a URL can access any persona
- Need private, secure user accounts
- Clerk is the easiest auth solution

**Features:**
- Sign up / sign in
- Magic links, Google OAuth, etc.
- User management dashboard

**Cost:** Free up to 10k MAUs

**When to add:** Before you launch publicly!

---

## **Priority Ranking**

### **Phase 1: Core Features (Now)**
1. ✅ Claude for chat (done)
2. ✅ Supabase for data (done)
3. ✅ Avatar gallery (done)
4. ⏳ **Clerk for auth** (next!)

### **Phase 2: Voice Features (After Auth)**
5. 🎙️ ElevenLabs text-to-speech
6. 🎤 Whisper speech-to-text
7. 📞 OpenAI Realtime API

### **Phase 3: Visual Features (Later)**
8. 🖼️ Replicate image generation
9. 👁️ Claude Vision

### **Phase 4: Advanced (When You Scale)**
10. 🧠 Pinecone semantic memory
11. 📊 Analytics (Posthog, Mixpanel)

---

## **Cost Estimation**

For 1,000 active users:

| Service | Est. Cost/mo |
|---------|-------------|
| Anthropic Claude | $50-200 |
| Supabase | Free-$25 |
| ElevenLabs | $22 (starter) |
| Whisper (OpenAI) | $10-30 |
| Replicate | $10-20 |
| Clerk | Free |
| **Total** | **$90-300/mo** |

---

## **What Makes a Companion App Great**

Looking at Nomi, Character.ai, Replika - here's what matters:

### **Table Stakes (Must-Have)**
- ✅ Good conversation (Claude)
- ✅ Persistent memory
- ✅ Nice avatars
- ⚠️ User accounts (need Clerk)

### **Differentiators (Make You Stand Out)**
- 🎙️ **Voice** - Most important! Nomi has this, you need it
- 📸 **Image sharing** - Let users share photos
- 🎨 **Personality customization** - You have version pinning (unique!)
- 💾 **Data export** - You have this (great!)
- 📊 **Transparent memory** - You have this (unique!)

### **Nice-to-Have (Later)**
- 🎮 Interactive activities
- 📱 Mobile app
- 🌐 Multi-language support
- 🎭 Multiple personas per user

---

## **Next Steps**

1. **Add Clerk auth** (1 day)
2. **Integrate ElevenLabs TTS** (1 day)
3. **Add Whisper STT** (1 day)
4. **Polish UI** (ongoing)
5. **Get 30 diverse avatars** (2 hours)

**Then you're ready to launch! 🚀**
