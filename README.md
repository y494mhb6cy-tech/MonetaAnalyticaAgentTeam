# Moneta Analytica — Task Rabbits MVP

A dark, executive MVP for Moneta Analytica Task Rabbits and Chains. Includes a run console, builders, artifacts archive, and branded DOCX/PDF output.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Environment Variables

- `OPENAI_API_KEY` (optional) — when set, the app calls OpenAI. When missing, the app uses a deterministic mock response.

## Netlify

- Build command: `npm run build`
- Publish directory: `.next`
- Required plugin: `@netlify/plugin-nextjs`

Set environment variables in Netlify **Site settings → Environment variables**.

## Redeploy (clear cache)

Use this when you need to force a clean build on Netlify.

**Trigger a deploy with cache cleared**

- Netlify UI: **Deploys → Trigger deploy → Clear cache and deploy site**
- Netlify CLI: `netlify deploy --build --prod`

**Verify deployment details**

- Confirm the deploy hash and published time in **Deploys** (latest deploy row shows the hash and timestamp).
- Expected build command: `npm run build:clean`
- Publish directory: `.next` with `@netlify/plugin-nextjs`

## Notes

- Task Rabbits, Chains, Runs, and Artifacts are stored in a JSON store under `/tmp` at runtime with a seed file committed in `data/seed.json`.
- Deep Mode is disabled by default. Enable it in **Settings** before running a deep task.
- DOCX and PDF outputs are generated server-side with Moneta Analytica branding.
- The Agent Map includes overlay toggles for People and live Activity, with animated active edges when Activity is enabled.
