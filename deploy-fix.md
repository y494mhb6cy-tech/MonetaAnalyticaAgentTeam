# Deploy fix note

**What broke**
- Netlify builds failed because the Agent Map module validator used a type predicate incompatible with the JSON module shape, causing a TypeScript error during `next build`.

**What fixed**
- The module validator now accepts `unknown` and narrows via a safe wrapper so the build can complete while still validating module data before rendering.
- The map page no longer contains unresolved merge conflict markers in its validation block.
