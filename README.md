# UruMap

Interactive maps of Uruguayan public buildings. UruMap renders
[mapcreator](https://github.com/emiliano-go/mapcreator) `BuildingMap` JSON files
directly in the browser: no backend, no database, no external map service.

## How it works

Maps are plain JSON files committed to `public/maps/`. A build step scans them and
generates `public/maps/index.json`, which the app uses as its catalog. The viewer
draws the tile grid (`base` + `overlay` + `meta` labels) on an HTML canvas, with
pan, zoom, floor switching and room search.

Maps are deep-linkable: opening `/?map=<id>&floor=<n>` restores that floor, and
the current map/floor is kept in the URL as you browse.

## Finding your way around

Every map has a search bar. Search for a room and UruMap draws the shortest
route from your current position to it, across floors when needed.

- The origin defaults to the building entrance; use **Marcar** and tap the map
  to set your own position (press `/` to jump to the search bar).
- Routes use the A* pathfinder from
  [mapcreator](https://github.com/emiliano-go/mapcreator), ported to plain JS
  (`src/lib/graph.js`, `src/lib/pathfinder.js`). Stairs and elevators create
  cross-floor edges; doors carry a small cost surcharge.
- Options: only accessible tiles, prefer elevators, or avoid the outside.
- The route is drawn as an A→B line for the current floor; use the floor tabs
  (or the "Ir a …" shortcut) to follow it across floors.

## Requirements

- Node.js 20+ (see `.nvmrc`)

## Development

```bash
npm ci           # install dependencies
npm run dev      # http://localhost:5173
npm run lint     # ESLint
npm run format   # Prettier
npm test         # parsing, room extraction, renderer and catalog checks
npm run build    # regenerates the index and builds to dist/
npm run start    # serve dist/ with Express on http://localhost:8080
```

## Adding a map

1. Create a building map in [mapcreator](https://github.com/emiliano-go/mapcreator)
   and export it as JSON (`Export` in the menu bar).
2. Save it under `public/maps/<building>/<name>.json` (a plain `BuildingMap` or the
   full editor export; both work).
3. Regenerate the catalog:
   ```bash
   npm run index
   ```
4. Commit both files. That's it. `npm test` fails if `index.json` is out of date.

## Configuration

All branding is set through environment variables (see `.env.example`):

| Variable               | Default                                               | Description                    |
| ---------------------- | ----------------------------------------------------- | ------------------------------ |
| `VITE_APP_NAME`        | `UruMap`                                              | App title                      |
| `VITE_APP_DESCRIPTION` | `Mapas interactivos de edificios públicos de Uruguay` | Meta description               |
| `VITE_DISCLAIMER`      | _(empty)_                                             | Optional disclaimer modal text |
| `VITE_METRICS_API_KEY` | _(empty)_                                             | Enables optional usage metrics |

## Docker

```bash
docker build -t urumap .
docker run -p 8080:8080 urumap
```

The production image runs as a non-root user, serves the built `dist/` with
compression and cache headers, and exposes `GET /healthz`.

## Project layout

```
src/components/   Vue components (header, floor tabs, canvas, search, routing)
src/lib/          Framework-free logic: map parsing, rooms, renderer, graph + A*
scripts/          Map catalog build step
test/             Node test runner suites
server.js         Express server for the production build
```

## License

MIT; see [LICENSE](LICENSE).
