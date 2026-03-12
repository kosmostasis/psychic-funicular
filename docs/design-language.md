# Typography — Inter only

The CDP keeps the **original GitHub-dark UI** (palette, layout, pages). The **only** ethswarm.org alignment is **typography**: **Inter** via `next/font/google`, same family as [ethswarm.org](https://ethswarm.org/) (their HTML uses Inter with Next font optimization).

## Implementation

- [apps/web/app/layout.tsx](../apps/web/app/layout.tsx) — `Inter({ variable: "--font-inter" })` on `<html>` and `inter.className` on `<body>`.
- [apps/web/app/globals.css](../apps/web/app/globals.css) — `body { font-family: var(--font-inter), system-ui, sans-serif; }` with original `--bg`, `--accent: #58a6ff`, etc.
- [apps/web/tailwind.config.js](../apps/web/tailwind.config.js) — `fontFamily.sans` uses `var(--font-inter)`.

No amber theme, no footer shell, no swarm-card components — reverted to prior style; fonts only.
