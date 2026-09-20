<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import MapCatalog from './components/MapCatalog.vue'
import AppHeader from './components/AppHeader.vue'
import FloorTabs from './components/FloorTabs.vue'
import MapCanvas from './components/MapCanvas.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import DisclaimerModal from './components/DisclaimerModal.vue'
import { appConfig } from './config.js'
import { normalizeBuildingMap, floorsOfBuilding } from './lib/map.js'
import { extractRooms } from './lib/rooms.js'
import { useMetrics } from './composables/useMetrics.js'

const { track, trackView } = useMetrics()

const view = ref('catalog')
const searchOpen = ref(false)
const canvasRef = ref(null)
const catalog = ref([])
const map = ref(null)
const selectedMapId = ref(null)
const buildingId = ref(null)
const currentFloor = ref(null)
const error = ref('')
const loading = ref(false)

const prefersLight =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
const theme = ref(prefersLight ? 'light' : 'dark')

const floors = computed(() => (map.value ? floorsOfBuilding(map.value, buildingId.value) : []))
const floorData = computed(
  () => floors.value.find((f) => f.floorIndex === currentFloor.value) || null
)
const rooms = computed(() => (map.value ? extractRooms(map.value) : []))

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

const selectMap = async (id) => {
  const entry = catalog.value.find((m) => m.id === id)
  if (!entry) return
  selectedMapId.value = id
  map.value = null
  error.value = ''
  loading.value = true
  view.value = 'map'
  track('map_open', { map: id })
  try {
    const res = await fetch(`${appConfig.base}${entry.file}`)
    if (!res.ok) throw new Error(`No se pudo cargar el mapa (HTTP ${res.status})`)
    const normalized = normalizeBuildingMap(await res.json())
    map.value = normalized
    buildingId.value = normalized.buildings[0]?.id || 'default'
    currentFloor.value = normalized.defaultFloor
    document.title = normalized.name
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const backToCatalog = () => {
  view.value = 'catalog'
  searchOpen.value = false
  document.title = appConfig.name
}

const selectBuilding = (id) => {
  buildingId.value = id
  const list = floorsOfBuilding(map.value, id)
  currentFloor.value = list[0]?.floorIndex ?? null
}

const selectRoom = async (room) => {
  searchOpen.value = false
  track('room_click', { room: room.label, floor: room.floor })
  if (room.floor !== currentFloor.value) {
    currentFloor.value = room.floor
    await nextTick()
  }
  setTimeout(() => canvasRef.value?.focusRoom(room.row, room.col), 30)
}

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

watch(theme, (value) => {
  document.documentElement.dataset.theme = value
})

onMounted(async () => {
  document.documentElement.dataset.theme = theme.value
  catalog.value = await loadCatalog()
  trackView()
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
        @back="backToCatalog"
        @search="searchOpen = true"
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

      <main class="map-area">
        <MapCanvas v-if="floorData" ref="canvasRef" :floor="floorData" :theme="theme" />
        <div v-if="loading" class="overlay-msg">Cargando mapa...</div>
        <div v-else-if="error" class="overlay-msg error">
          <p>{{ error }}</p>
          <button @click="backToCatalog">Volver</button>
        </div>
      </main>
    </template>

    <SearchOverlay
      :open="searchOpen"
      :rooms="rooms"
      @select="selectRoom"
      @close="searchOpen = false"
    />
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
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
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

code {
  background: var(--surface-2);
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
