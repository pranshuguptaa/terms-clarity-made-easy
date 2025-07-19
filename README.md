# Terms & Conditions Simplifier SaaS

## Backend Environment Setup

Create a `.env` file in your `backend/` directory with the following variables:

```
HUGGINGFACE_API_KEY=your_actual_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

- **HUGGINGFACE_API_KEY**: Get from https://huggingface.co/settings/tokens (choose Inference or Read role).
- **SUPABASE_URL**: Your Supabase project URL (from Supabase dashboard).
- **SUPABASE_SERVICE_KEY**: Your Supabase service role key (from Supabase dashboard, never expose to frontend).

## Hugging Face API Key Instructions

1. Create a free Hugging Face account: https://huggingface.co/join
2. Go to https://huggingface.co/settings/tokens
3. Click "New token", choose 'Read' or 'Inference' role, and copy your API key.
4. In your backend’s environment, add:
   HUGGINGFACE_API_KEY=your_actual_api_key

## Health Check Endpoint

The backend exposes a health check endpoint at `/health`:

```
GET /health
```

Returns:
```
{"status": "ok", "message": "Backend is healthy."}
```

## Deployment Notes
- Never expose your Supabase service key to the frontend or version control.
- Set all secrets in your deployment environment (Render, Railway, Fly.io, etc.).
- The backend logs errors to stdout for monitoring.
