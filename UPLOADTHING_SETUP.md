# Uploadthing Setup Guide

This guide explains how to set up Uploadthing for file uploads in the Shippr Chat application.

## 1. Create an Uploadthing Account

1. Go to [uploadthing.com](https://uploadthing.com)
2. Sign up for a free account (or sign in with GitHub)
3. Create a new app in the dashboard

## 2. Get Your API Keys

After creating an app, you'll get two keys:

- **UPLOADTHING_TOKEN** - Your secret token (keep this private!)

## 3. Add Environment Variables

Add the following to your `.env` file:

```env
# Uploadthing
UPLOADTHING_TOKEN=your_uploadthing_token_here
```

For production (Vercel), add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add `UPLOADTHING_TOKEN`

## 4. File Upload Limits

The current configuration supports:

### Images
- Max file size: 8MB
- Max files per upload: 4
- Supported formats: All image types (jpg, png, gif, webp, etc.)

### Videos
- Max file size: 64MB
- Max files per upload: 1

### Audio
- Max file size: 16MB
- Max files per upload: 4

### Documents
- Max file size: 16MB
- Max files per upload: 4
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT

## 5. Usage in the App

Files can be uploaded by clicking the attachment (paperclip) icon in the message input. The uploaded files will:

1. Be stored securely on Uploadthing's servers
2. Display inline in the chat message
3. Appear in the Contact Info panel under Media, Links, or Docs tabs

## 6. Troubleshooting

### "Upload failed" error
- Check that your `UPLOADTHING_TOKEN` is correctly set
- Verify the file size doesn't exceed limits
- Check the file type is supported

### "Callback failed" error in local development
This is expected behavior! In local development, Uploadthing's servers cannot reach your `localhost:3000` to execute the server callback. The file is still uploaded successfully.

**Solution**: The app is configured with `awaitServerData: false` which means the client gets the file URL immediately without waiting for the server callback. Your files will upload and display correctly.

### Files not displaying
- Ensure the message was saved successfully (check network tab)
- Verify the attachment URLs are accessible
- Check browser console for CORS errors

### Slow uploads
- Large files may take longer to upload
- Consider compressing images before upload
- Check your network connection

## 7. Pricing

Uploadthing offers:
- **Free tier**: 2GB storage, 2GB bandwidth/month
- **Pro tier**: Starting at $10/month for more storage and bandwidth

For most development and small-scale production use, the free tier is sufficient.

## 8. Security Notes

- The `UPLOADTHING_TOKEN` should never be exposed to the client
- All uploads require authentication (user must be logged in)
- Files are associated with the user who uploaded them
- The API validates user access before allowing uploads

## 9. Customization

To modify upload settings, edit `/src/lib/uploadthing.ts`:

```typescript
// Example: Increase image file size limit
messageImage: f({
  image: { maxFileSize: "16MB", maxFileCount: 8 },
})
```

## 10. API Routes

- `POST /api/uploadthing` - Handles file uploads
- `GET /api/conversations/[id]/media` - Fetches all media for a conversation

## Need Help?

- [Uploadthing Documentation](https://docs.uploadthing.com)
- [Uploadthing Discord](https://discord.gg/uploadthing)
