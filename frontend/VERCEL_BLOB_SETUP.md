# Environment Variables for Resume Upload

## Required for Vercel Blob Storage

Add the following to your `.env.local` file:

```env
# Vercel Blob Storage (for resume uploads)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

## How to get your Vercel Blob token:

1. Go to your Vercel project dashboard
2. Navigate to Storage → Blob
3. Create a new Blob store if you haven't already
4. Copy the `BLOB_READ_WRITE_TOKEN` from the environment variables section
5. Add it to your `.env.local` file

The token will be automatically available in your Next.js API routes.
