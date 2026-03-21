# Deploy

Use the root worker deploy flow instead of `pages.dev`.

## Local deploy

From the repository root run:

```powershell
npm run deploy:worker
```

If you run this in script mode, set `CLOUDFLARE_API_TOKEN` in `.env` or export it in the current shell first. Interactive `wrangler login` by itself may not be enough for scripted runs.

What it does:

1. Forces Wrangler to use user-writable config/cache directories instead of the current shell directory.
2. Finds or creates `tooth-harmony-pro-db` in the current Cloudflare account.
3. Rewrites the local `database_id` in `wrangler.jsonc`.
4. Uploads `JWT_SECRET` and `SUPERUSER_*` secrets to the root worker.
5. Builds and deploys the single worker that serves both the frontend and `/api/*`.

## Why not Pages

`pages.dev` was returning `405` for `/api/*` because this project now runs as a single Cloudflare Worker with static assets plus API routes, not as a Pages site with a separate backend.
