<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import MapCatalog from './components/MapCatalog.vue'
import AppHeader from './components/AppHeader.vue'
import FloorTabs from './components/FloorTabs.vue'
import MapCanvas from './components/MapCanvas.vue'
import SearchBar from './components/SearchBar.vue'
import RoutePanel from './components/RoutePanel.vue'
import DisclaimerModal from './components/DisclaimerModal.vue'
import { appConfig } from './config.js'
import { normalizeBuildingMap, floorsOfBuilding } from './lib/map.js'
import { extractRooms } from './lib/rooms.js'
import { buildGraph, getNode, nearestTraversable, findEntrance } from './lib/graph.js'
import { findPath } from './lib/pathfinder.js'
import { useMetrics } from './composables/useMetrics.js'
import { readStorage, writeStorage } from './lib/storage.js'

const THEME_KEY = 'urumap_theme'

const { track, trackView } = useMetrics()

const view = ref('catalog')
const canvasRef = ref(null)
const searchBarRef = ref(null)
const catalog = ref([])
const map = ref(null)
const selectedMapId = ref(null)
const buildingId = ref(null)
const currentFloor = ref(null)
const error = ref('')
const loading = ref(false)

const origin = ref(null)
const goal = ref(null)
const pathResult = ref(null)
const pickingOrigin = ref(false)
const routeOptions = ref({ accessibleOnly: false, preferElevator: false, noOutside: false })

const prefersLight =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
const theme = ref(readStorage(THEME_KEY) || (prefersLight ? 'light' : 'dark'))

const floors = computed(() => (map.value ? floorsOfBuilding(map.value, buildingId.value) : []))
const floorData = computed(
  () => floors.value.find((f) => f.floorIndex === currentFloor.value) || null
)
const rooms = computed(() => (map.value ? extractRooms(map.value) : []))

const graphData = computed(() =>
  map.value ? buildGraph(map.value, { noOutside: routeOptions.value.noOutside }) : null
)

const route = computed(() => {
  const result = pathResult.value
  if (!result?.found || result.path.length === 0) return null
  return {
    path: result.path,
    start: result.path[0],
    goal: result.path[result.path.length - 1]
  }
})

const loadCatalog = async () => {
  try {
    const res = await fetch(appConfig.catalogUrl)
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : data.maps || []
  } catch {
    return []
  }
}

const setMetaDescription = (content) => {
  document.querySelector('meta[name="description"]')?.setAttribute('content', content)
}

const syncUrl = (replace = false) => {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  if (view.value === 'map' && selectedMapId.value) {
    params.set('map', selectedMapId.value)
    if (currentFloor.value !== null && currentFloor.value !== undefined) {
      params.set('floor', String(currentFloor.value))
    }
  }
  const query = params.toString()
  const url = `${window.location.pathname}${query ? `?${query}` : ''}`
  window.history[replace ? 'replaceState' : 'pushState']({ map: selectedMapId.value }, '', url)
}

const resetRoute = () => {
  origin.value = null
  goal.value = null
  pathResult.value = null
  pickingOrigin.value = false
}

const selectMap = async (id, { fromUrl = false } = {}) => {
  const entry = catalog.value.find((m) => m.id === id)
  if (!entry) return
  selectedMapId.value = id
  map.value = null
  resetRoute()
  error.value = ''
  loading.value = true
  view.value = 'map'
  if (!fromUrl) {
    syncUrl()
    track('map_open', { map: id })
  }
  try {
    const res = await fetch(`${appConfig.base}${entry.file}`)
    if (!res.ok) throw new Error(`No se pudo cargar el mapa (HTTP ${res.status})`)
    const normalized = normalizeBuildingMap(await res.json())
    map.value = normalized
    buildingId.value = normalized.buildings[0]?.id || 'default'
    currentFloor.value = normalized.defaultFloor
    document.title = normalized.name
    setMetaDescription(normalized.description || appConfig.description)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const backToCatalog = ({ fromUrl = false } = {}) => {
  view.value = 'catalog'
  resetRoute()
  selectedMapId.value = null
  map.value = null
  document.title = appConfig.name
  setMetaDescription(appConfig.description)
  if (!fromUrl && typeof window !== 'undefined') {
    window.history.pushState({}, '', window.location.pathname)
  }
}

const applyRoute = async () => {
  const params = new URLSearchParams(window.location.search)
  const mapId = params.get('map')
  if (!mapId) {
    backToCatalog({ fromUrl: true })
    return
  }
  await selectMap(mapId, { fromUrl: true })
  const floorParam = params.get('floor')
  if (floorParam !== null) {
    const floor = Number(floorParam)
    if (Number.isInteger(floor)) currentFloor.value = floor
  }
}

const selectBuilding = (id) => {
  buildingId.value = id
  const list = floorsOfBuilding(map.value, id)
  currentFloor.value = list[0]?.floorIndex ?? null
}

const snapNode = (point) => {
  if (!map.value || !point) return null
  return (
    getNode(map.value, point.floor, point.row, point.col) ??
    nearestTraversable(map.value, point.floor, point.row, point.col)
  )
}

const computeRoute = () => {
  if (!map.value || !origin.value || !goal.value) {
    pathResult.value = null
    return
  }
  const from = snapNode(origin.value)
  const to = snapNode(goal.value)
  if (!from || !to) {
    pathResult.value = { found: false, path: [], totalWeight: 0, floorChanges: 0 }
    return
  }
  pathResult.value = findPath(graphData.value, from.id, to.id, {
    accessibleOnly: routeOptions.value.accessibleOnly,
    preferElevator: routeOptions.value.preferElevator
  })
}

const chooseGoal = (room) => {
  if (!map.value || !room) return
  goal.value = room
  if (!origin.value) origin.value = findEntrance(map.value)
  track('route', { to: room.label, floor: room.floor })
  computeRoute()
  if (origin.value && origin.value.floor !== currentFloor.value) {
    currentFloor.value = origin.value.floor
  }
}

const onPickTile = (tile) => {
  if (!map.value) return
  pickingOrigin.value = false
  const node = nearestTraversable(map.value, currentFloor.value, tile.row, tile.col)
  if (!node) return
  const floor = map.value.floors.find((f) => f.floorIndex === node.floorIndex)
  origin.value = {
    floor: node.floorIndex,
    row: node.row,
    col: node.col,
    label: 'Mi ubicación',
    floorLabel: floor?.label ?? ''
  }
  computeRoute()
}

const togglePickOrigin = () => {
  pickingOrigin.value = !pickingOrigin.value
}

const updateRouteOptions = (options) => {
  routeOptions.value = options
  computeRoute()
}

const goToGoalFloor = async (floor) => {
  currentFloor.value = floor
  if (!goal.value) return
  await nextTick()
  setTimeout(() => canvasRef.value?.focusRoom(goal.value.row, goal.value.col), 30)
}

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

watch(theme, (value) => {
  document.documentElement.dataset.theme = value
  writeStorage(THEME_KEY, value)
})

watch(currentFloor, () => {
  if (view.value === 'map') syncUrl(true)
})

const onKeydown = (event) => {
  if (event.key === '/' && view.value === 'map') {
    event.preventDefault()
    searchBarRef.value?.focus()
  }
}

const onPopState = async () => {
  await applyRoute()
}

onMounted(async () => {
  document.documentElement.dataset.theme = theme.value
  catalog.value = await loadCatalog()
  await applyRoute()
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('popstate', onPopState)
  trackView()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('popstate', onPopState)
})
</script>

<template>
  <DisclaimerModal />

  <div class="app">
    <MapCatalog
      v-if="view === 'catalog'"
      :app-name="appConfig.name"
      :description="appConfig.description"
      :maps="catalog"
      @select="selectMap"
    />

    <template v-else>
      <AppHeader
        :map-name="map?.name || appConfig.name"
        :theme="theme"
        @back="backToCatalog()"
        @toggle-theme="toggleTheme"
        @reset="canvasRef?.fit()"
      />

      <FloorTabs
        :buildings="map?.buildings || []"
        :current-building="buildingId"
        :floors="floors"
        :current="currentFloor"
        @select="currentFloor = $event"
        @select-building="selectBuilding"
      />

      <SearchBar ref="searchBarRef" :rooms="rooms" @select="chooseGoal" />

      <RoutePanel
        :origin="origin"
        :goal="goal"
        :result="pathResult"
        :options="routeOptions"
        :picking="pickingOrigin"
        :current-floor="currentFloor"
        @pick-origin="togglePickOrigin"
        @clear="resetRoute"
        @update:options="updateRouteOptions"
        @go-to="goToGoalFloor"
      />

      <main class="map-area">
        <MapCanvas
          v-if="floorData"
          ref="canvasRef"
          :floor="floorData"
          :theme="theme"
          :route="route"
          :picking="pickingOrigin"
          @pick="onPickTile"
        />
        <div v-if="loading" class="overlay-msg" aria-live="polite">Cargando mapa...</div>
        <div v-else-if="error" class="overlay-msg error" role="alert">
          <p>{{ error }}</p>
          <button @click="backToCatalog()">Volver</button>
        </div>
        <div v-if="pickingOrigin" class="pick-hint" aria-live="polite">
          Tocá el mapa para marcar tu ubicación
        </div>
      </main>
    </template>
  </div>
</template>

<style>
:root,
:root[data-theme='dark'] {
  --surface: #16181d;
  --surface-2: #1f232b;
  --surface-3: #2a2f39;
  --border: #313640;
  --text: #f5f6f7;
  --text-muted: #9aa2ad;
  --accent: #3b82f6;
}

:root[data-theme='light'] {
  --surface: #ffffff;
  --surface-2: #f3f4f6;
  --surface-3: #e5e7eb;
  --border: #d1d5db;
  --text: #111827;
  --text-muted: #6b7280;
  --accent: #2563eb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  overscroll-behavior: none;
}

body {
  font-family:
    'Segoe UI',
    -apple-system,
    BlinkMacSystemFont,
    Roboto,
    sans-serif;
  background: var(--surface);
  color: var(--text);
  -webkit-text-size-adjust: 100%;
}

.app {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.map-area {
  flex: 1;
  position: relative;
  min-height: 0;
}

.overlay-msg {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  pointer-events: none;
}

.overlay-msg.error {
  color: #ef4444;
  pointer-events: auto;
}

.overlay-msg button {
  padding: 0.6rem 1.2rem;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
}

.pick-hint {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  padding: 0.5rem 0.9rem;
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

code {
  background: var(--surface-2);
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
