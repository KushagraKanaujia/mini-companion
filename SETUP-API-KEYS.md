# API Keys Setup Guide

This guide shows you how to get all the API keys needed for the full mini-companion experience.

## Required (Already Configured)

### ✅ Anthropic API
- **Where**: https://console.anthropic.com/settings/keys
- **Used for**: Chat responses
- **Status**: You have this configured, but need to add credits

### ✅ Supabase
- **Where**: https://supabase.com/dashboard/project/yxqzjpzboshpcnptkqip/settings/api
- **Used for**: Database + file storage
- **Status**: Configured

## Optional Features

### 🎨 AI-Generated Profile Pictures

**Service**: Replicate
**Get key**: https://replicate.com/account/api-tokens

1. Sign up for Replicate (free tier available)
2. Go to Account > API tokens
3. Create a new token
4. Add to `.env.local`:
   ```
   REPLICATE_API_KEY=r8_xxxxxxxxxxxxxxxxxxxxx
   ```

**Usage**: Click "✨ AI Generate" when creating a persona to generate a unique profile picture.

### 🎙️ Voice Selection

**Service**: ElevenLabs
**Get key**: https://elevenlabs.io/app/settings/api-keys

1. Sign up for ElevenLabs (free tier: 10k chars/month)
2. Go to Profile > API Keys
3. Create a new API key
4. Add to `.env.local`:
   ```
   ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxx
   ```

**Usage**: Click "Choose Voice from ElevenLabs" when creating a persona to select from professional AI voices.

## Testing Without Optional Keys

The app works fine without Replicate and ElevenLabs:
- **No Replicate key**: AI Generate button will show an error, but you can still upload custom images
- **No ElevenLabs key**: Voice selection will show a message, but you can skip voice selection

## Current Status

```bash
✅ ANTHROPIC_API_KEY - Configured (needs credits)
✅ NEXT_PUBLIC_SUPABASE_URL - Configured
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - Configured
✅ SUPABASE_SERVICE_ROLE_KEY - Configured
⚠️ REPLICATE_API_KEY - Not configured (optional)
⚠️ ELEVENLABS_API_KEY - Not configured (optional)
```
