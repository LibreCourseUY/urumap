import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { normalizeBuildingMap, isValidFloor } from '../src/lib/map.js'
import { extractRooms, filterRooms } from '../src/lib/rooms.js'
import { renderFloor } from '../src/lib/render.js'

const mapPath = fileURLToPath(
  new URL('../public/maps/demo/edificio-demo.json', import.meta.url)
)

const raw = JSON.parse(await readFile(mapPath, 'utf8'))
const map = normalizeBuildingMap(raw)

assert.equal(map.floors.length, 3)
assert.ok(map.floors.every(isValidFloor), 'all floors have valid tile types')

const rooms = extractRooms(map)
assert.equal(rooms.length, 27, 'eight rooms plus the stairs label per floor')
assert.ok(
  rooms.some((r) => r.label === 'Aula 1' && r.floor === 0),
  'floor 0 room label extracted'
)
assert.ok(
  rooms.some((r) => r.label === 'Oficina 8' && r.floor === 2),
  'floor 2 room label extracted'
)

assert.equal(filterRooms(rooms, 'aula').length, 8)
assert.equal(filterRooms(rooms, 'oficina 3').length, 1)
assert.equal(filterRooms(rooms, 'zzz').length, 0)

assert.throws(() => normalizeBuildingMap({ nope: true }), /floors/)

let fills = 0
const stubCtx = new Proxy(
  { canvas: { width: 400, height: 300 }, measureText: () => ({ width: 20 }) },
  {
    get(target, prop) {
      if (prop in target) return target[prop]
      return () => {
        if (prop === 'fillRect') fills++
      }
    }
  }
)
renderFloor(stubCtx, {
  floor: map.floors[0],
  tileSize: 24,
  offsetX: 0,
  offsetY: 0,
  width: 400,
  height: 300,
  theme: 'dark'
})
assert.ok(fills > 0, 'renderFloor draws tiles')

console.log('map.test.mjs: all checks passed')
