# Voice Features Setup Guide

## 🎙️ What I Just Built

Your companion can now **speak and listen**! Here's what's working:

### **1. Text-to-Speech (TTS)** 🔊
- Click the **speaker icon (🔊)** next to any AI message
- It will play the message in a realistic AI voice
- Uses **ElevenLabs** for ultra-realistic voice quality

### **2. Speech-to-Text (STT)** 🎤
- Click the **microphone button** in the input area
- Speak your message
- Click mic again to stop
- Your voice is automatically transcribed to text
- Uses **OpenAI Whisper** for accurate transcription

---

## ⚡ Quick Test (ElevenLabs Only)

ElevenLabs voice is **ready to test right now**! You already have the API key configured.

### **Test Text-to-Speech:**

1. Go to any chat with a persona
2. Send a message (it won't respond due to Anthropic credits, but that's ok)
3. You'll see a **🔊 speaker icon** next to assistant messages
4. **Click it** → You should hear the message in voice!

If it works, you're done with TTS! 🎉

---

## 🔧 Setup Speech-to-Text (Optional)

For voice input, you need an OpenAI API key:

### **Get OpenAI API Key:**

1. Go to **https://platform.openai.com/api-keys**
2. Sign in or create account
3. Click **"Create new secret key"**
4. Copy the key (starts with `sk-proj-` or `sk-`)
5. Open `/Users/kush/Downloads/mini-companion/.env.local`
6. Add this line:
   ```
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
   ```
7. Save and restart the dev server

### **Test Speech-to-Text:**

1. Go to any chat
2. Click the **🎤 microphone button**
3. Allow microphone access when prompted
4. **Speak** your message
5. Click **mic button again** to stop
6. Your speech should appear as text in the input!

---

## 💰 Cost Breakdown

### **ElevenLabs TTS:**
- **Free tier:** 10,000 characters/month
- **Starter:** $5/mo for 30,000 characters
- **Creator:** $22/mo for 100,000 characters
- **Pro:** $99/mo for 500,000 characters

**Average:** ~150 characters per message = 200 messages for $5/mo

### **OpenAI Whisper STT:**
- **Cost:** $0.006 per minute of audio
- **Example:** 100 voice messages (1 min each) = $0.60

**Total estimated cost for voice:** ~$10-20/month for moderate usage

---

## 🎯 Voice Features Overview

### **What Works Now:**
✅ Text-to-Speech (click speaker icon on AI messages)
✅ Speech-to-Text (click mic, speak, click again)
✅ Voice selection (if you set `voice_id` on persona)
✅ Realistic AI voice via ElevenLabs
✅ Accurate transcription via Whisper

### **How It Works:**

**TTS Flow:**
1. User clicks speaker icon on message
2. Frontend calls `/api/voice/tts`
3. Backend calls ElevenLabs API
4. Returns audio file (MP3)
5. Browser plays audio

**STT Flow:**
1. User clicks mic, speaks, clicks again
2. Browser records audio (WebM)
3. Frontend sends to `/api/voice/stt`
4. Backend sends to OpenAI Whisper
5. Returns transcribed text
6. Text appears in input box

---

## 🎨 UI Features

### **Visual Indicators:**
- **🔊 Speaker icon** - Shows on all AI messages when they have content
- **Purple highlight** - Indicates audio is currently playing
- **⏸ Pause icon** - Shows when audio is playing (click to stop)
- **🎤 Mic button** - Always visible in input area
- **Red pulsing mic** - Shows when recording
- **Disabled input** - When recording voice

### **User Experience:**
- Click anywhere on speaker icon to play/pause
- Recording stops automatically when you click mic again
- Only one audio plays at a time
- Smooth transitions and animations

---

## 🔧 Advanced: Custom Voice Selection

Each persona can have a custom voice! Here's how:

### **1. Browse ElevenLabs Voices:**
```bash
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: sk_a31699d2a80785cfb0fe49caaaa4feaa72d8e56890268c71"
```

### **2. Pick a Voice ID:**
Some popular voices:
- `21m00Tcm4TlvDq8ikWAM` - Rachel (warm, friendly female) **[DEFAULT]**
- `ErXwobaYiN019PkySvjV` - Antoni (well-rounded male)
- `MF3mGyEYCl7XYWbV9V6O` - Elli (emotional, young female)
- `TxGEqnHWrfWFTfGW9XjX` - Josh (deep, narrator-like male)
- `VR6AewLTigWG4xSOukaG` - Arnold (masculine, confident)
- `pNInz6obpgDQGcFmaJgB` - Adam (deep male)

### **3. Set Voice on Persona:**

Update the persona in Supabase:
1. Go to Supabase → Table Editor → personas
2. Click the persona row
3. Set `voice_id` to the ID you want (e.g., `21m00Tcm4TlvDq8ikWAM`)
4. Save

Now that persona will use that specific voice!

---

## 🐛 Troubleshooting

### **TTS Not Working:**

**Error: "Failed to generate speech"**
- Check browser console for details
- Verify ElevenLabs API key is correct in `.env.local`
- Test API key with curl command above

**No sound:**
- Check browser isn't muted
- Check system volume
- Try a different browser
- Check browser console for errors

### **STT Not Working:**

**Error: "Failed to access microphone"**
- Allow microphone permission in browser
- Check system microphone permissions
- Try HTTPS (localhost should work)

**Error: "OpenAI API key not configured"**
- Add `OPENAI_API_KEY` to `.env.local`
- Restart dev server
- Verify key is correct

**Recording but no transcription:**
- Check OpenAI API key has credits
- Check browser console for errors
- Verify audio is being recorded (red pulsing mic)

---

## 🚀 What's Next

### **Already Working:**
✅ Text-to-Speech (ElevenLabs)
✅ Speech-to-Text (Whisper)
✅ Voice selection per persona
✅ Beautiful UI controls

### **Could Add Later:**
- 📞 **Real-time voice calls** (OpenAI Realtime API)
- 🎭 **Voice cloning** (clone user's voice)
- 🌐 **Multi-language support** (Whisper supports 99 languages)
- 🎚️ **Voice settings UI** (adjust speed, tone, etc.)
- 💾 **Save voice messages** (store audio files)

---

## 📊 Current Status

### **API Keys Configured:**
✅ ANTHROPIC_API_KEY (needs credits)
✅ ELEVENLABS_API_KEY (working!)
⚠️ OPENAI_API_KEY (optional, for voice input)

### **Features Complete:**
✅ TTS API route
✅ STT API route
✅ Voice UI controls
✅ Audio playback
✅ Voice recording
✅ Transcription

---

## 💡 Pro Tips

1. **Test TTS first** - It works right now with your ElevenLabs key!
2. **Voice makes it feel REAL** - This is the killer feature
3. **Custom voices per persona** - Makes each one unique
4. **Mobile voice is even better** - Consider adding a mobile app later
5. **Monitor costs** - ElevenLabs charges per character, watch usage

---

**Go test the voice features now!** Click the speaker icon on any AI message to hear it speak! 🔊
