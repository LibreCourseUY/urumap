export function floorRoomLabels(floor) {
  const groups = new Map()
  for (const [key, meta] of Object.entries(floor.meta || {})) {
    const label = (meta.label || '').trim()
    if (!label) continue
    const [row, col] = key.split(',').map(Number)
    if (!Number.isInteger(row) || !Number.isInteger(col)) continue
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push({ row, col })
  }
  return [...groups.entries()].map(([label, tiles]) => ({
    label,
    row: Math.round(tiles.reduce((s, t) => s + t.row, 0) / tiles.length),
    col: Math.round(tiles.reduce((s, t) => s + t.col, 0) / tiles.length)
  }))
}

export function extractRooms(map) {
  const rooms = []
  for (const floor of map.floors) {
    for (const { label, row, col } of floorRoomLabels(floor)) {
      rooms.push({
        id: `${floor.floorIndex}-${label}`,
        label,
        floor: floor.floorIndex,
        floorLabel: floor.label,
        row,
        col
      })
    }
  }
  return rooms
}

export function filterRooms(rooms, query, limit = 12) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return rooms.filter((room) => room.label.toLowerCase().includes(q)).slice(0, limit)
}
