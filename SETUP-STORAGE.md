# Supabase Storage Setup

To enable image uploads for persona profile pictures, you need to create a storage bucket in Supabase.

## Steps:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/yxqzjpzboshpcnptkqip

2. Click **Storage** in the left sidebar

3. Click **"New bucket"**

4. Enter the following:
   - **Name**: `personas`
   - **Public bucket**: ✅ **Check this box** (so images are publicly accessible)
   - Click **"Create bucket"**

5. Done! Your app can now upload and display persona profile images.

## Testing Image Upload

1. Go to http://localhost:3000/create
2. Click "Upload" and select an image
3. The image will be uploaded to Supabase Storage and displayed

## Optional: Set up file size limits

In the Storage > personas bucket settings, you can set:
- Max file size: 2MB (recommended for profile pictures)
- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
