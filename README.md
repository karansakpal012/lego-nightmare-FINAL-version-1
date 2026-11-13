# LEGO Nightmare – Chapter 1 prototype

First-person horror escape room built with Three.js + Vite, packaged for Windows with Electron.
Fan-made, LEGO-*inspired* project – not affiliated with or endorsed by the LEGO Group.

## Controls
WASD move · Shift run · Mouse look · F flashlight · E / click interact · Esc pause · F11 fullscreen (Electron)

## Cloud workflow (no local tools needed)
1. Create a GitHub repo and upload this project (or drag the files into the web UI).
2. Open it in **GitHub Codespaces** → run `npm run dev` → open the forwarded port 5173.
3. Push to `main`: GitHub Actions builds the Windows installer + portable `.exe` (Actions tab → artifact).
4. Tag a release (`git tag v0.1.0 && git push --tags`) to publish the `.exe` files on the Releases page.

## Structure
`src/world.js` room + puzzle objects · `src/player.js` movement/collision · `src/flashlight.js` battery light ·
`src/interaction.js` raycast use · `src/inventory.js` items · `src/ui.js` HUD/menus · `src/lego.js` brick builders.

## Roadmap
Monster AI + chase → hiding spots → jump scares → health/death → rooms 2–6 and puzzles
(screwdriver, power, 4-digit code, basement) → audio → settings.
