# How to Generate Diverse, High-Quality AI Avatars

## 🎨 Best Tools for Professional AI Avatars

### **1. Midjourney** (Best Quality, $10/month)
**Why:** Industry-leading quality, photorealistic portraits

**Prompts for diversity:**
```
/imagine professional portrait photo of a [description], friendly expression, studio lighting, clean background, photorealistic, 8k --ar 1:1 --v 6

Examples:
- "young Asian woman with warm smile, modern style"
- "middle-aged Black man with glasses, professional"
- "plus-size Latina woman, confident expression"
- "elderly white man with kind eyes"
- "androgynous person with colorful hair"
- "South Asian woman in hijab, gentle smile"
- "athletic Hispanic man, approachable"
- "curvy Black woman, natural hair, joyful"
```

**How to use:**
1. Join Discord: https://discord.gg/midjourney
2. Subscribe: https://www.midjourney.com/account
3. Generate in #newbies channels
4. Download and upload to your app

---

### **2. DALL-E 3 via ChatGPT** (Easiest, $20/month)
**Why:** No learning curve, integrated with ChatGPT Plus

**Prompt template:**
```
Create a professional portrait photo of [detailed description], with [expression], studio lighting, clean background, photorealistic, high quality

Examples:
- "a confident plus-size Black woman in her 30s, with natural curls, warm smile"
- "a gentle-looking elderly Asian man with glasses, kind expression"
- "a young Middle Eastern woman wearing a headscarf, friendly smile"
- "a tall athletic Latino man in his 20s, approachable expression"
- "a non-binary person with purple hair, creative style, welcoming smile"
```

**How to use:**
1. Subscribe to ChatGPT Plus
2. Paste prompts, generate images
3. Download and upload

---

### **3. Replicate (Stable Diffusion)** (API, Pay-per-use)
**Why:** Cheapest, API-first, good quality

**Fix your API key issue:**
Your Replicate API key might be wrong. Get a new one:
1. Go to https://replicate.com/account/api-tokens
2. Delete old token
3. Create new token
4. Update `.env.local`

**Test it works:**
```bash
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    "input": {
      "prompt": "professional portrait of a friendly person, studio lighting"
    }
  }'
```

---

### **4. Leonardo.ai** (Free tier available)
**Why:** Free tier, easy to use, good for batch generation

**Steps:**
1. Sign up: https://leonardo.ai
2. Use "PhotoReal" mode
3. Same prompts as above
4. Download all at once

---

## 📦 Diversity Checklist for Avatar Gallery

Generate **at least 30 avatars** covering:

### **Ethnicity/Race:**
- ✅ Asian (East, South, Southeast)
- ✅ Black/African
- ✅ White/Caucasian
- ✅ Hispanic/Latino
- ✅ Middle Eastern
- ✅ Indigenous
- ✅ Mixed race

### **Body Types:**
- ✅ Slim/Athletic
- ✅ Average build
- ✅ Plus-size/Curvy
- ✅ Muscular

### **Age Ranges:**
- ✅ Young adults (20s)
- ✅ Middle-aged (30s-40s)
- ✅ Mature (50s-60s)
- ✅ Elderly (70+)

### **Gender Presentation:**
- ✅ Feminine
- ✅ Masculine
- ✅ Androgynous
- ✅ Non-binary

### **Style/Aesthetic:**
- ✅ Professional/corporate
- ✅ Casual/friendly
- ✅ Creative/artistic
- ✅ Traditional/cultural clothing

### **Features:**
- ✅ With/without glasses
- ✅ Different hairstyles
- ✅ Facial hair variations
- ✅ Head coverings (hijab, turban, etc.)

---

## 🚀 Quick Start: Get 30 Avatars in 1 Hour

### **Using ChatGPT Plus (Easiest):**

1. **Paste this into ChatGPT:**
```
Generate 30 professional portrait photos for an AI companion app.
Each should be photorealistic, studio-lit, clean background.
Include diverse:
- Ethnicities (Asian, Black, White, Latino, Middle Eastern, etc.)
- Ages (20s to 70s)
- Genders (male, female, non-binary)
- Body types (slim, average, plus-size)
- Styles (professional, casual, creative)

Start with: young Asian woman with warm smile
```

2. **Download all images**

3. **Upload to your app:**
   - Go to http://localhost:3000/admin/upload-avatars
   - Upload all 30 at once
   - Copy the JSON
   - Paste into `public/avatars/gallery.json`

---

## 🎯 Pro Tip: Batch Generation

**For Midjourney users:**
```
/imagine [prompt 1] --ar 1:1 --v 6
/imagine [prompt 2] --ar 1:1 --v 6
/imagine [prompt 3] --ar 1:1 --v 6
```

Generate 10 at a time, download all, upload in one batch.

---

## 💰 Cost Comparison

| Tool | Cost | Quality | Speed | Ease |
|------|------|---------|-------|------|
| Midjourney | $10/mo | ⭐⭐⭐⭐⭐ | Medium | Medium |
| DALL-E 3 | $20/mo | ⭐⭐⭐⭐ | Fast | Easy |
| Replicate | $0.01/img | ⭐⭐⭐⭐ | Fast | Hard (API) |
| Leonardo | Free! | ⭐⭐⭐ | Fast | Easy |

**Recommendation:** Start with Leonardo.ai (free) to get 30 avatars, then upgrade to Midjourney for premium quality.
