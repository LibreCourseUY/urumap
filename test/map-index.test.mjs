import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { buildIndex, walk } from '../scripts/build-map-index.mjs'
import { normalizeBuildingMap } from '../src/lib/map.js'

const mapsDir = fileURLToPath(new URL('../public/maps/', import.meta.url))

test('every map file parses as a valid building map', async () => {
  const files = await walk(mapsDir)
  assert.ok(files.length > 0, 'at least one map is present')
  for (const file of files) {
    const raw = JSON.parse(await readFile(file, 'utf8'))
    assert.doesNotThrow(() => normalizeBuildingMap(raw))
  }
})

test('committed index.json matches the maps on disk', async () => {
  const expected = await buildIndex(mapsDir)
  const committed = JSON.parse(
    await readFile(new URL('../public/maps/index.json', import.meta.url), 'utf8')
  )
  assert.deepEqual(committed, expected, 'run `npm run index` and commit the result')
})
