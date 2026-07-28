# Avatar Gallery Setup

## Quick Start: Add Your AI-Generated Avatars

### Method 1: Use the Admin Upload Page (Recommended)

1. **Generate AI avatars** using:
   - Midjourney: `portrait of a friendly AI companion, professional headshot, 512x512`
   - DALL-E 3: Same prompt
   - Stable Diffusion: Same prompt
   - Or download free AI portraits from Unsplash/Pexels

2. **Go to the upload page**: http://localhost:3000/admin/upload-avatars

3. **Upload your images** (they'll be stored in Supabase Storage)

4. **Copy the generated JSON** and paste it into `public/avatars/gallery.json`

### Method 2: Manual Setup (For Local Development)

1. Place your avatar images in this folder (`public/avatars/`)
   - Name them: `avatar-1.png`, `avatar-2.png`, etc.
   - Recommended size: 512x512px or larger
   - Formats: PNG, JPG, WebP

2. Update `gallery.json` with your avatar details:

```json
{
  "avatars": [
    {
      "id": "avatar-1",
      "url": "/avatars/avatar-1.png",
      "name": "Luna",
      "tags": ["gentle", "caring", "feminine"]
    }
  ]
}
```

### Where to Get AI Avatars (Free)

**Option A: Generate with AI tools**
- **ChatGPT DALL-E**: Ask "Create a portrait of [description]"
- **Midjourney**: Free trial available
- **Stable Diffusion** (free): https://huggingface.co/spaces/stabilityai/stable-diffusion

**Option B: Download free AI portraits**
- https://this-person-does-not-exist.com (refresh for new faces)
- https://generated.photos/faces (free with attribution)
- Unsplash AI collection

**Option C: Use placeholder images temporarily**
- https://i.pravatar.cc/512?img=1 (change number 1-70 for different faces)
- Update `gallery.json` to use these URLs

## Example gallery.json with placeholders:

```json
{
  "avatars": [
    {
      "id": "placeholder-1",
      "url": "https://i.pravatar.cc/512?img=12",
      "name": "Alex",
      "tags": ["friendly", "professional"]
    },
    {
      "id": "placeholder-2",
      "url": "https://i.pravatar.cc/512?img=45",
      "name": "Luna",
      "tags": ["warm", "caring"]
    },
    {
      "id": "placeholder-3",
      "url": "https://i.pravatar.cc/512?img=33",
      "name": "Atlas",
      "tags": ["strong", "supportive"]
    }
  ]
}
```

Just copy the example above to get started immediately!
