# Pokémon Pokédex

An interactive field guide to Pokémon found from the original **Pokémon Red, Blue, and Yellow** games, and **Pokémon Gold, Silver and Crystal**. Browse the complete Kanto and Johto index, search by name or Pokédex number, filter by type, inspect stats and abilities, and play each Pokémon's cry.

## Live app

- **Vercel:** [pokemon-pokedex-sigma-six.vercel.app](https://pokemon-pokedex-sigma-six.vercel.app)
- **OpenAI Sites:** [kanto-151-pokedex.afagajustine.chatgpt.site](https://kanto-151-pokedex.afagajustine.chatgpt.site)

The Vercel project is connected to this GitHub repository. Merges into `main` automatically trigger a new production deployment. The OpenAI Sites deployment is separate and is not automatically updated by GitHub pushes.

## Features

- Complete National Pokédex entries **#001–#251**
- Search by Pokémon name or Pokédex number
- Type filters for quick browsing
- Original pixel sprites in the index
- Official artwork in the specimen panel
- Red, Blue, or Yellow Pokédex descriptions where available
- Height, weight, habitat, growth rate, and capture rate
- Abilities, types, and all six base stats
- Pokémon cry playback
- Previous/next navigation and left/right keyboard shortcuts
- Responsive layouts for desktop, tablet, and mobile
- Accessible labels, keyboard controls, reduced-motion support, and descriptive image text

## Data sources and attribution

This project uses the following public resources:

- [Pokémon Database — Red, Blue & Yellow Pokédex](https://pokemondb.net/pokedex/game/red-blue-yellow) for the Kanto game roster and reference information.
- [PokéAPI](https://pokeapi.co/) and the [PokéAPI v2 endpoints](https://pokeapi.co/docs/v2) for structured Pokémon data, species descriptions, types, abilities, measurements, habitats, base stats, artwork, and cries.
- [PokéAPI Sprites](https://github.com/PokeAPI/sprites) for the pixel sprite assets displayed in the index.

Data is requested in the visitor's browser when a Pokémon is selected. No API key is required.

Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and The Pokémon Company. This is an unofficial fan project and is not affiliated with or endorsed by those companies.

## How the app works

The app keeps the original 151-species roster locally so the index appears immediately. When an entry is opened, the browser requests two PokéAPI resources in parallel:

1. `/api/v2/pokemon/{id}` supplies types, abilities, measurements, stats, sprites, artwork, and cries.
2. `/api/v2/pokemon-species/{id}` supplies the genus, habitat, growth rate, capture rate, and game-specific flavor text.

The interface is built with React and TypeScript. The repository contains two build targets that share the same page and stylesheet:

- **OpenAI Sites / Cloudflare:** built with vinext and the Cloudflare Vite plugin.
- **Vercel:** built as a client-side Vite application from `vercel/`.

## Technology

- React 19
- TypeScript
- Vite / vinext
- Tailwind CSS processing with custom CSS
- PokéAPI
- Vercel and OpenAI Sites hosting

## Local development

### Requirements

- Node.js 22.13 or newer
- npm

### Install and run

```bash
git clone https://github.com/Jafaga/pokemon-pokedex.git
cd pokemon-pokedex
npm install
npm run dev
```

Open the local address printed in the terminal. The development command runs the vinext/OpenAI Sites version with live reloading.

## Build and validation commands

```bash
# Build the OpenAI Sites / Cloudflare version
npm run build

# Build the Vercel-compatible static version
npm run build:vercel

# Run the existing project test command
npm test

# Run ESLint
npm run lint
```

Generated output is written to `dist/` for Sites and `vercel-dist/` for Vercel. Both directories are ignored by Git.

## Project structure

```text
app/
  page.tsx             Main Pokédex interface and data-fetching logic
  globals.css          Complete responsive visual design
  layout.tsx           Sites metadata and font configuration
public/
  og.png               Social sharing image
vercel/
  index.html           Vercel HTML entry point and metadata
  src/main.tsx         Vercel React entry point
.openai/hosting.json   OpenAI Sites project configuration
vercel.json            Vercel build and routing configuration
vite.config.ts         vinext / Cloudflare build configuration
vite.vercel.config.ts  Vercel-specific Vite build configuration
```

## Making and publishing changes

Editing a local file does not change the live site by itself. Use a branch and pull request:

```bash
git switch main
git pull origin main
git switch -c codex/describe-your-change

# Edit and test the project, then:
git add path/to/changed-file
git commit -m "Describe the change"
git push -u origin codex/describe-your-change
```

Open a pull request on GitHub. Vercel creates a preview deployment for the branch. Once the pull request is reviewed and merged into `main`, Vercel automatically publishes the production update.

For a very small direct update, a push to `main` will also deploy production, but a branch and preview are safer.

## Configuration notes

- No secrets or environment variables are currently required.
- PokéAPI availability and the visitor's network connection affect live details and audio.
- The type-filter index uses lightweight local hints for fast initial filtering; complete types are always shown in the selected Pokémon's details.
- Browser audio policies may require the visitor to click the cry button before sound can play.
- The app is a single-page client interface on Vercel; `vercel.json` rewrites routes to `index.html`.

## Troubleshooting

### Pokémon details do not load

Check the internet connection and confirm [pokeapi.co](https://pokeapi.co/) is reachable. The app displays a retry option when a request fails.

### A cry does not play

Make sure the browser tab is not muted, the device volume is enabled, and playback was started by clicking the sound button.

### A Vercel deployment fails

Confirm `npm run build:vercel` succeeds locally and that `package.json`, `vercel.json`, and `vite.vercel.config.ts` were committed together.

### The GitHub update is not live

Confirm the change was merged into `main`, then check the Vercel deployment status. Branch pushes create previews rather than replacing production.

## License and use

No open-source license has been added. Unless a license is added later, the source remains available for viewing but no additional reuse rights are granted. Third-party Pokémon data and assets remain subject to their respective owners and source terms.
