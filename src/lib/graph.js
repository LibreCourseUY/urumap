// Navigable graph builder, ported from mapcreator (src/core/GraphBuilder.ts).
// Kept framework-free so it can be unit tested without Vue.

export const FLOOR_CHANGE_WEIGHT = 10

const DIRECTIONS = [
  [0, 1],
  [0, -1],
  [1, 0],
  [-1, 0]
]

export function nodeId(floorIndex, row, col) {
  return `${floorIndex}:${row}:${col}`
}

export function isTraversable(base, overlay, noOutside = false) {
  if (!base) return false
  if (base === 'stairs' || base === 'elevator' || base === 'floor') return true
  if (base === 'outside' || base === 'dirt_path') return !noOutside
  if (base === 'wall' && (overlay === 'door' || overlay === 'exit_door')) return true
  return false
}

function tileWeight(base, overlay, meta) {
  const doorSurcharge = overlay === 'door' || overlay === 'exit_door' ? (meta?.weight ?? 0.5) : 0
  const baseCost = base === 'outside' ? 3 : 1
  return baseCost + doorSurcharge
}

function floorBounds(floor) {
  return {
    width: floor.width ?? floor.base?.[0]?.length ?? 0,
    height: floor.height ?? floor.base?.length ?? 0
  }
}

// Contiguous clusters of the same vertical-connection tile type.
function findVerticalGroups(floor) {
  const { width, height } = floorBounds(floor)
  const groups = []
  const visited = new Set()

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const type = floor.base?.[row]?.[col]
      if (type !== 'stairs' && type !== 'elevator') continue
      const key = `${row},${col}`
      if (visited.has(key)) continue

      const tiles = []
      const queue = [{ row, col }]
      visited.add(key)

      while (queue.length > 0) {
        const cur = queue.pop()
        tiles.push(cur)
        for (const [dr, dc] of DIRECTIONS) {
          const nr = cur.row + dr
          const nc = cur.col + dc
          const nk = `${nr},${nc}`
          if (visited.has(nk)) continue
          if (floor.base?.[nr]?.[nc] !== type) continue
          visited.add(nk)
          queue.push({ row: nr, col: nc })
        }
      }

      const anchorRow = Math.min(...tiles.map((t) => t.row))
      const anchorCol = Math.min(...tiles.filter((t) => t.row === anchorRow).map((t) => t.col))
      groups.push({
        id: `${floor.floorIndex}:${type}:${anchorRow}:${anchorCol}`,
        type,
        floorIndex: floor.floorIndex,
        tiles,
        anchor: { row: anchorRow, col: anchorCol }
      })
    }
  }

  return groups
}

export function buildGraph(map, options = {}) {
  const { allowDiagonal = false, noOutside = false } = options
  const adjacency = new Map()
  const nodeMeta = new Map()
  const nodeTypes = new Map()

  const floorMap = new Map()
  for (const floor of map.floors) {
    floorMap.set(floor.floorIndex, {
      base: floor.base,
      overlay: floor.overlay,
      meta: floor.meta ?? {}
    })
  }

  const dirs = allowDiagonal ? [...DIRECTIONS, [1, 1], [1, -1], [-1, 1], [-1, -1]] : DIRECTIONS

  function addCrossFloorEdge(fromId, toFloorIndex, row, col, edges, weight) {
    const target = floorMap.get(toFloorIndex)
    if (!target) return
    const targetBase = target.base?.[row]?.[col]
    const targetOverlay = target.overlay?.[row]?.[col] ?? null
    if (!isTraversable(targetBase, targetOverlay, noOutside)) return
    edges.push({
      from: fromId,
      to: nodeId(toFloorIndex, row, col),
      weight: FLOOR_CHANGE_WEIGHT + weight,
      crossFloor: true
    })
  }

  for (const floor of map.floors) {
    const { width, height } = floorBounds(floor)
    const meta = floor.meta ?? {}
    const groups = findVerticalGroups(floor)

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const baseType = floor.base?.[row]?.[col]
        const overlayType = floor.overlay?.[row]?.[col] ?? null
        if (!isTraversable(baseType, overlayType, noOutside)) continue

        const id = nodeId(floor.floorIndex, row, col)
        const tileMeta = meta[`${row},${col}`] ?? {}
        const edges = []

        for (const [dr, dc] of dirs) {
          const nr = row + dr
          const nc = col + dc
          if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue
          const nBase = floor.base?.[nr]?.[nc]
          const nOverlay = floor.overlay?.[nr]?.[nc] ?? null
          if (!isTraversable(nBase, nOverlay, noOutside)) continue

          const diagonal = dr !== 0 && dc !== 0
          const weight = diagonal ? Math.SQRT2 : tileWeight(nBase, nOverlay, meta[`${nr},${nc}`])
          edges.push({ from: id, to: nodeId(floor.floorIndex, nr, nc), weight, crossFloor: false })
        }

        if (baseType === 'stairs' || baseType === 'elevator') {
          const group = groups.find((g) => g.tiles.some((t) => t.row === row && t.col === col))
          const anchorKey = group ? `${group.anchor.row},${group.anchor.col}` : `${row},${col}`
          const gMeta = meta[anchorKey] ?? tileMeta

          if (baseType === 'stairs') {
            if (gMeta.toFloorSuperior != null) {
              addCrossFloorEdge(id, gMeta.toFloorSuperior, row, col, edges, 2)
            }
            if (gMeta.toFloorInferior != null) {
              addCrossFloorEdge(id, gMeta.toFloorInferior, row, col, edges, 2)
            }
          } else {
            for (const targetFloor of gMeta.connectedFloors ?? []) {
              if (targetFloor === floor.floorIndex) continue
              addCrossFloorEdge(id, targetFloor, row, col, edges, 1)
            }
          }
        }

        adjacency.set(id, edges)
        nodeMeta.set(id, tileMeta)
        nodeTypes.set(id, { base: baseType, overlay: overlayType })
      }
    }
  }

  return { adjacency, nodeMeta, nodeTypes }
}

export function getNode(map, floorIndex, row, col) {
  const floor = map.floors.find((f) => f.floorIndex === floorIndex)
  if (!floor) return null
  const base = floor.base?.[row]?.[col]
  const overlay = floor.overlay?.[row]?.[col] ?? null
  if (!isTraversable(base, overlay)) return null
  return {
    id: nodeId(floorIndex, row, col),
    floorIndex,
    row,
    col,
    base,
    overlay,
    meta: floor.meta?.[`${row},${col}`] ?? {}
  }
}

// Closest traversable tile to (row, col), used to snap taps and room labels.
export function nearestTraversable(map, floorIndex, row, col, maxRadius = 25) {
  const direct = getNode(map, floorIndex, row, col)
  if (direct) return direct

  const floor = map.floors.find((f) => f.floorIndex === floorIndex)
  if (!floor) return null
  const { width, height } = floorBounds(floor)
  const seen = new Set([`${row},${col}`])
  const queue = [{ row, col, d: 0 }]
  let head = 0

  while (head < queue.length) {
    const cur = queue[head++]
    const node = getNode(map, floorIndex, cur.row, cur.col)
    if (node) return node
    if (cur.d >= maxRadius) continue
    for (const [dr, dc] of DIRECTIONS) {
      const nr = cur.row + dr
      const nc = cur.col + dc
      const key = `${nr},${nc}`
      if (seen.has(key)) continue
      if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue
      seen.add(key)
      queue.push({ row: nr, col: nc, d: cur.d + 1 })
    }
  }
  return null
}

function isConnected(map, node) {
  if (node.base === 'stairs' || node.base === 'elevator') return true
  return DIRECTIONS.some(([dr, dc]) => getNode(map, node.floorIndex, node.row + dr, node.col + dc))
}

function toPoint(node, floor, label) {
  return {
    floor: node.floorIndex,
    row: node.row,
    col: node.col,
    label,
    floorLabel: floor?.label ?? ''
  }
}

// Sensible default origin: just inside an exit, else the first connected tile.
function scanFloor(floor, visit) {
  const height = floor.height ?? floor.base?.length ?? 0
  const width = floor.width ?? floor.base?.[0]?.length ?? 0
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (visit(row, col)) return true
    }
  }
  return false
}

export function findEntrance(map) {
  const exits = []
  for (const floor of map.floors) {
    scanFloor(floor, (row, col) => {
      if (floor.overlay?.[row]?.[col] === 'exit_door') exits.push({ floor, row, col })
      return false
    })
  }

  // A connected walkable tile next to an entrance is the most natural start.
  for (const { floor, row, col } of exits) {
    for (const [dr, dc] of DIRECTIONS) {
      const node = getNode(map, floor.floorIndex, row + dr, col + dc)
      if (node && isConnected(map, node)) return toPoint(node, floor, 'Entrada')
    }
  }

  // Otherwise the first connected tile, preferring plain floors over stairs.
  for (const preferFloor of [true, false]) {
    for (const floor of map.floors) {
      let found = null
      scanFloor(floor, (row, col) => {
        const node = getNode(map, floor.floorIndex, row, col)
        if (!node || !isConnected(map, node)) return false
        if (preferFloor && node.base !== 'floor') return false
        found = toPoint(node, floor, 'Inicio')
        return true
      })
      if (found) return found
    }
  }
  return null
}
