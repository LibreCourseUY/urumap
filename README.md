# UruMap

Interactive maps of Uruguayan public buildings. UruMap renders
[mapcreator](https://github.com/emiliano-go/mapcreator) `BuildingMap` JSON files
directly in the browser: no backend, no database, no external map service.

## How it works

Maps are plain JSON files committed to `public/maps/`. A build step scans them and
generates `public/maps/index.json`, which the app uses as its catalog. The viewer
draws the tile grid (`base` + `overlay` + `meta` labels) on an HTML canvas, with
pan, zoom, floor switching and room search.

## Adding a map

1. Create a building map in [mapcreator](https://github.com/emiliano-go/mapcreator)
   and export it as JSON (`Export` in the menu bar).
2. Save it under `public/maps/<building>/<name>.json` (a plain `BuildingMap` or the
   full editor export — both work).
3. Regenerate the catalog:
   ```bash
   npm run index
   ```
4. Commit both files. That's it.

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # checks parsing, room extraction and the renderer
npm run build    # regenerates the index and builds to dist/
npm run start    # serve dist/ with Express
```

## Configuration

All branding is set through environment variables (see `.env.example`):

| Variable                 | Default                                              | Description                        |
| ------------------------ | ---------------------------------------------------- | ---------------------------------- |
| `VITE_APP_NAME`          | `UruMap`                                             | App title                          |
| `VITE_APP_DESCRIPTION`   | `Mapas interactivos de edificios públicos de Uruguay`| Meta description                   |
| `VITE_DISCLAIMER`        | _(empty)_                                            | Optional disclaimer modal text     |
| `VITE_METRICS_API_KEY`   | _(empty)_                                            | Enables optional usage metrics     |

## Docker

```bash
docker build -t urumap .
docker run -p 8080:8080 urumap
```

## License

MIT — see [LICENSE](LICENSE).
