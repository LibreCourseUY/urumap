# Contributing to UruMap

Thanks for helping map Uruguayan public buildings! This guide walks you through
contributing.

## What is UruMap?

UruMap is a static viewer for building maps exported from
[mapcreator](https://github.com/emiliano-go/mapcreator). It helps people find
rooms and spaces in public buildings.

## Contribution Cycle

1. Fork and clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/urumap.git
   cd urumap
   ```
2. Create a branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Install dependencies and develop:
   ```bash
   npm install
   npm run dev
   ```
4. Run the checks:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
5. Commit, push to your fork, and open a Pull Request.

### Commit types

`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`.

Example: `feat: add map for the Faculty of Chemistry`.

## Adding a map

1. Export a `BuildingMap` JSON from mapcreator.
2. Place it in `public/maps/<building>/<name>.json`.
3. Run `npm run index` and commit the regenerated `public/maps/index.json`.

## Code standards

- Vue components in `src/components/`, shared logic in `src/lib/`.
- Keep the renderer independent of Vue so it stays testable.
- Scoped CSS where possible.

## Signed commits (required)

All commits must be GPG-signed. See the community
[GPG setup guide](https://librecourseuy.github.io/git).

```bash
git config --global commit.gpgsign true
```

## Contributor License Agreement

By opening a Pull Request with signed commits you agree to our
[CLA](https://librecourseuy.github.io/CLA).
