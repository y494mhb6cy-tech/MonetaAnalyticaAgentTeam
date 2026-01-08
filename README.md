# Moneta Analytica OS — Task Rabbits MVP

A dark, executive MVP for Moneta Analytica OS Task Rabbits and Chains. Includes a run console, builders, artifacts archive, and branded DOCX/PDF output.

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

## How to use Moneta Analytica OS Map

- Open `/map` to view the operating system canvas.
- Use the sidebar tabs to browse Personnel or Agents; search filters the list.
- Click an item to focus it on the canvas, or add it if it is not already placed.
- Use **+ Add** to create new Personnel or Agent records with minimal fields.
- Toggle **Connect Mode** and click a Personnel node, then an Agent node, to create a connection.
- Drag nodes freely to reposition them; use **Clear layout / Reset positions** if nodes drift off-screen.
- The map persists nodes and connections in `localStorage` under `maos_map_state_v1`.

## Notes

- Task Rabbits, Chains, Runs, and Artifacts are stored in a JSON store under `/tmp` at runtime with a seed file committed in `data/seed.json`.
- Deep Mode is disabled by default. Enable it in **Settings** before running a deep task.
- DOCX and PDF outputs are generated server-side with Moneta Analytica OS branding.
