// A* pathfinder, ported from mapcreator (src/core/Pathfinder.ts).
// Uses a binary heap open set and the Manhattan distance heuristic over
// "floor:row:col" node ids.

class MinHeap {
  constructor() {
    this.heap = []
  }

  push(key, priority) {
    this.heap.push({ key, priority })
    let i = this.heap.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.heap[parent].priority <= this.heap[i].priority) break
      ;[this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]]
      i = parent
    }
  }

  pop() {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()
    if (this.heap.length > 0) {
      this.heap[0] = last
      let i = 0
      const size = this.heap.length
      for (;;) {
        let smallest = i
        const left = 2 * i + 1
        const right = 2 * i + 2
        if (left < size && this.heap[left].priority < this.heap[smallest].priority) smallest = left
        if (right < size && this.heap[right].priority < this.heap[smallest].priority)
          smallest = right
        if (smallest === i) break
        ;[this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]]
        i = smallest
      }
    }
    return top.key
  }

  get size() {
    return this.heap.length
  }
}

function heuristic(a, b) {
  const [, ar, ac] = a.split(':').map(Number)
  const [, br, bc] = b.split(':').map(Number)
  return Math.abs(ar - br) + Math.abs(ac - bc)
}

function countFloorChanges(cameFrom, nodeId) {
  let count = 0
  let current = nodeId
  const visited = new Set()
  while (cameFrom.has(current) && !visited.has(current)) {
    visited.add(current)
    const prev = cameFrom.get(current)
    if (Number(prev.split(':')[0]) !== Number(current.split(':')[0])) count++
    current = prev
  }
  return count
}

function reconstructPath(cameFrom, current, graph, nodeMeta, nodeTypes, fromId) {
  const pathIds = []
  let node = current
  while (node !== fromId) {
    pathIds.unshift(node)
    node = cameFrom.get(node) ?? fromId
  }
  pathIds.unshift(fromId)

  const path = []
  let totalWeight = 0

  for (let i = 0; i < pathIds.length; i++) {
    const id = pathIds[i]
    const [floorIndex, row, col] = id.split(':').map(Number)
    if (i > 0) {
      const edge = graph.get(id)?.find((e) => e.to === pathIds[i - 1])
      if (edge) totalWeight += edge.weight
    }
    const type = nodeTypes?.get(id)
    path.push({
      id,
      floorIndex,
      row,
      col,
      base: type?.base ?? 'floor',
      overlay: type?.overlay ?? null,
      meta: nodeMeta.get(id) ?? {}
    })
  }

  return { found: true, path, totalWeight, floorChanges: countFloorChanges(cameFrom, current) }
}

export function findPath(graphData, fromId, toId, options = {}) {
  const { adjacency: graph, nodeMeta, nodeTypes } = graphData
  const empty = { found: false, path: [], totalWeight: 0, floorChanges: 0 }

  if (!graph.has(fromId) || !graph.has(toId)) return empty

  function runAStar(skipStairs) {
    const openSet = new MinHeap()
    const gScore = new Map()
    const cameFrom = new Map()
    const visited = new Set()

    gScore.set(fromId, 0)
    openSet.push(fromId, heuristic(fromId, toId))

    while (openSet.size > 0) {
      const current = openSet.pop()
      if (visited.has(current)) continue
      visited.add(current)

      if (current === toId) {
        return reconstructPath(cameFrom, current, graph, nodeMeta, nodeTypes, fromId)
      }

      for (const edge of graph.get(current) ?? []) {
        if (skipStairs && edge.crossFloor && nodeTypes?.get(current)?.base === 'stairs') continue

        const neighbor = edge.to
        if (options.accessibleOnly && nodeMeta.get(neighbor)?.accessible === false) continue

        if (options.maxFloorChanges !== undefined) {
          const currentFloor = Number(current.split(':')[0])
          const neighborFloor = Number(neighbor.split(':')[0])
          if (
            currentFloor !== neighborFloor &&
            countFloorChanges(cameFrom, current) >= options.maxFloorChanges
          ) {
            continue
          }
        }

        const tentativeG = (gScore.get(current) ?? Infinity) + edge.weight
        if (tentativeG >= (gScore.get(neighbor) ?? Infinity)) continue

        cameFrom.set(neighbor, current)
        gScore.set(neighbor, tentativeG)
        openSet.push(neighbor, tentativeG + heuristic(neighbor, toId))
      }
    }

    return empty
  }

  if (options.preferElevator) {
    const elevatorFirst = runAStar(true)
    if (elevatorFirst.found) return elevatorFirst
  }

  return runAStar(false)
}
