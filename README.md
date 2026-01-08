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
- See `env.example` for a starter template.

## Netlify

- Build command: `npm run build`
- Publish directory: `.next`
- Required plugin: `@netlify/plugin-nextjs`

Set environment variables in Netlify **Site settings → Environment variables**.

## Notes

- Task Rabbits, Chains, Runs, and Artifacts are stored in a JSON store under `/tmp` at runtime with a seed file committed in `data/seed.json`.
- Deep Mode is disabled by default. Enable it in **Settings** before running a deep task.
- DOCX and PDF outputs are generated server-side with Moneta Analytica branding.
