# MAOS — Moneta Analytica Agent Team

A dark, executive MVP for MAOS (Moneta Analytica Agent Team) Task Rabbits and Chains. Includes a run console, builders, artifacts archive, and branded DOCX/PDF output.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:clean` | Clean `.next` folder and build (used by CI) |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run Jest test suite |

## Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch
```

The test suite includes:
- Unit tests for UI components (Button, Modal, Sidebar, etc.)
- Integration tests for interactivity flows
- 21 tests total with Jest + React Testing Library

## Deployment (Netlify)

### Configuration
The `netlify.toml` is pre-configured:
- Build command: `npm run build:clean`
- Publish directory: `.next`
- Required plugin: `@netlify/plugin-nextjs`
- Node version: 20

### Environment Variables
Set in Netlify **Site settings → Environment variables**:
- `OPENAI_API_KEY` (optional) — When set, the app calls OpenAI. When missing, uses deterministic mock responses.

### Deploy Commands
```bash
# Deploy to Netlify (if CLI installed)
netlify deploy --build --prod

# Force clean deploy via Netlify UI
# Deploys → Trigger deploy → Clear cache and deploy site
```

## What's Included in v1 Demo

### Core Features
- **Executive Dashboard** (`/home`) — Key metrics, capacity gauges, team breakdowns, risk alerts
- **Org Map** (`/map`) — Interactive 120-person org visualization with pan/zoom, touch support
- **Personnel Directory** (`/personnel`) — Browse human operators with filters and detail panels
- **Agents View** (`/agents`) — Topology visualization of autonomous modules
- **Company Tasks** (`/company-tasks`) — Task board with filtering by team/person

### UI/UX
- Mobile-first responsive design (iPhone and up)
- Bottom navigation on mobile, sidebar on desktop
- ESC key closes all modals and drawers
- Touch gestures for map pan/zoom
- First-time intro experience with skip option
- Dark theme with optional "deep mode"

### Data
- Demo seeded with 120 personnel across 5 departments
- 8 agent modules with metrics
- Realistic company tasks with revenue attribution
- State persists to localStorage

## What's Intentionally Excluded

- Real-time data sync (localStorage only)
- User authentication
- Production database integration
- Task editing (read-only demo)
- Document generation (stubs only in demo)

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4 with custom theme
- **State**: React Context API with localStorage persistence
- **Testing**: Jest + React Testing Library
- **Deployment**: Netlify with @netlify/plugin-nextjs

## Project Structure

```
/app                    # Next.js App Router pages
  /home                 # Executive dashboard
  /map                  # Org map visualization
  /personnel            # Personnel directory
  /agents               # Agents topology
  /api                  # API routes (tasks, AI, artifacts)
/components             # React components
/lib                    # Business logic and utilities
  maos-store.tsx        # React Context store
  maos-types.ts         # TypeScript types
  maos-seed.ts          # Demo data generators
/__tests__              # Jest test files
/data                   # Seed data files
```

## Notes

- State persists under `maos_personnel_v2`, `maos_agents_v2`, `maos_map_state_v2`
- Reset demo data by clearing localStorage or using the Settings page
- Deep Mode is disabled by default (enable in Settings)
- AI Preview uses OpenAI if `OPENAI_API_KEY` is set, otherwise shows mock responses
