import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { normalizeBuildingMap } from '../src/lib/map.js'
import { extractRooms } from '../src/lib/rooms.js'
import { buildGraph, getNode, nearestTraversable, findEntrance } from '../src/lib/graph.js'
import { findPath } from '../src/lib/pathfinder.js'

const raw = JSON.parse(
  await readFile(
    fileURLToPath(new URL('../public/maps/demo/edificio-demo.json', import.meta.url)),
    'utf8'
  )
)
const map = normalizeBuildingMap(raw)
const graph = buildGraph(map)

function nodeFor(point) {
  return (
    getNode(map, point.floor, point.row, point.col) ??
    nearestTraversable(map, point.floor, point.row, point.col)
  )
}

test('builds a graph with traversable nodes and edges', () => {
  assert.ok(graph.adjacency.size > 0)
  assert.ok(graph.adjacency.has('0:1:1'), 'stairs tile is a node')
  assert.ok(
    graph.adjacency.get('0:1:1').some((edge) => edge.crossFloor),
    'stairs connect floors'
  )
})

test('finds a connected default origin', () => {
  const entrance = findEntrance(map)
  assert.ok(entrance)
  assert.ok(['Entrada', 'Inicio'].includes(entrance.label))
  assert.ok(getNode(map, entrance.floor, entrance.row, entrance.col))
})

test('routes from a room to the entrance across floors', () => {
  const entrance = findEntrance(map)
  const room = extractRooms(map).find((r) => r.label === 'Oficina 8')
  assert.ok(room, 'Oficina 8 exists on the top floor')

  const from = nodeFor(room)
  const to = nodeFor(entrance)
  const result = findPath(graph, from.id, to.id)

  assert.equal(result.found, true)
  assert.ok(result.path.length > 1)
  assert.ok(result.floorChanges >= 1, 'route uses the stairs')
  assert.equal(result.path[0].id, from.id)
  assert.equal(result.path.at(-1).id, to.id)
})

test('returns not found for unknown nodes', () => {
  const result = findPath(graph, '0:1:1', 'does-not-exist')
  assert.equal(result.found, false)
  assert.deepEqual(result.path, [])
})

test('maxFloorChanges limits vertical movement', () => {
  const entrance = findEntrance(map)
  const room = extractRooms(map).find((r) => r.label === 'Oficina 8')
  const result = findPath(graph, nodeFor(room).id, nodeFor(entrance).id, { maxFloorChanges: 0 })
  assert.equal(result.found, false)
})

test('nearestTraversable snaps a solid wall tile to a walkable neighbour', () => {
  const floor = map.floors[0]
  let wall = null
  for (let row = 0; row < floor.height && !wall; row++) {
    for (let col = 0; col < floor.width; col++) {
      if (floor.base[row][col] === 'wall' && !floor.overlay[row][col]) {
        wall = { row, col }
        break
      }
    }
  }
  assert.ok(wall, 'map has a plain wall tile')
  assert.equal(getNode(map, 0, wall.row, wall.col), null)
  assert.ok(nearestTraversable(map, 0, wall.row, wall.col))
})
