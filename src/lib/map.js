const TILE_TYPES = new Set(['wall', 'floor', 'stairs', 'elevator', 'outside', 'dirt_path', 'void'])

const OVERLAY_TYPES = new Set(['door', 'exit_door', 'room'])

export function normalizeBuildingMap(raw) {
  const map = raw && raw.map && Array.isArray(raw.map.floors) ? raw.map : raw
  if (!map || !Array.isArray(map.floors) || map.floors.length === 0) {
    throw new Error('Mapa inválido: falta "floors"')
  }
  const floors = map.floors.map((floor) => ({
    ...floor,
    buildingId: floor.buildingId || 'default',
    meta: floor.meta || {}
  }))
  return {
    id: map.id || 'map',
    name: map.name || 'Mapa sin nombre',
    description: map.description || '',
    region: map.region || '',
    version: map.version || 'unknown',
    defaultFloor: Number.isInteger(map.defaultFloor) ? map.defaultFloor : floors[0].floorIndex,
    floors,
    buildings: map.buildings || [{ id: 'default', name: map.name || 'Edificio' }]
  }
}

export function floorsOfBuilding(map, buildingId) {
  const floors = map.floors
    .filter((f) => f.buildingId === buildingId)
    .sort((a, b) => a.order - b.order)
  return floors.length > 0 ? floors : map.floors
}

export function isValidFloor(floor) {
  if (!floor || !Array.isArray(floor.base)) return false
  return floor.base.every((row) => row.every((tile) => TILE_TYPES.has(tile)))
}

export function isValidOverlay(floor) {
  if (!floor || !Array.isArray(floor.overlay)) return false
  return floor.overlay.every((row) => row.every((cell) => cell === null || OVERLAY_TYPES.has(cell)))
}
