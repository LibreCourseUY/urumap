<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import AppHeader from './components/AppHeader.vue'
import FloorTabs from './components/FloorTabs.vue'
import MapCanvas from './components/MapCanvas.vue'
import DisclaimerModal from './components/DisclaimerModal.vue'
import { appConfig } from './config.js'
import { normalizeBuildingMap, floorsOfBuilding } from './lib/map.js'
import { extractRooms } from './lib/rooms.js'
import { useMetrics } from './composables/useMetrics.js'

const { track, trackView } = useMetrics()

const canvasRef = ref(null)
const catalog = ref([])
const map = ref(null)
const selectedMapId = ref(null)
const buildingId = ref(null)
const currentFloor = ref(null)
const error = ref('')
const loading = ref(true)

const prefersLight =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches
const theme = ref(prefersLight ? 'light' : 'dark')

const floors = computed(() =>
  map.value ? floorsOfBuilding(map.value, buildingId.value) : []
)
const floorData = computed(
  () => floors.value.find((f) => f.floorIndex === currentFloor.value) || null
)
const rooms = computed(() => (map.value ? extractRooms(map.value) : []))

const loadCatalog = async () => {
  const res = await fetch(appConfig.catalogUrl)
  if (!res.ok) throw new Error(`No se pudo cargar el catálogo (HTTP ${res.status})`)
  const data = await res.json()
  return Array.isArray(data) ? data : data.maps || []
}

const selectMap = async (id) => {
  const entry = catalog.value.find((m) => m.id === id)
  if (!entry) return
  selectedMapId.value = id
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`${appConfig.base}${entry.file}`)
    if (!res.ok) throw new Error(`No se pudo cargar el mapa (HTTP ${res.status})`)
    const normalized = normalizeBuildingMap(await res.json())
    map.value = normalized
    buildingId.value = normalized.buildings[0].id
    currentFloor.value = normalized.defaultFloor
  } catch (err) {
    error.value = err.message
    map.value = null
  } finally {
    loading.value = false
  }
}

const selectRoom = async (room) => {
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
  try {
    catalog.value = await loadCatalog()
    if (catalog.value.length > 0) await selectMap(catalog.value[0].id)
    else loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
  trackView()
})
</script>

<template>
  <DisclaimerModal />

  <div class="app">
    <AppHeader
      :app-name="appConfig.name"
      :maps="catalog"
      :selected-map="catalog.find((m) => m.id === selectedMapId) || null"
      :rooms="rooms"
      :theme="theme"
      @select-map="selectMap"
      @select-room="selectRoom"
      @reset="canvasRef?.fit()"
      @toggle-theme="toggleTheme"
    />

    <FloorTabs :floors="floors" :current="currentFloor" @select="currentFloor = $event" />

    <main class="map-area">
      <MapCanvas ref="canvasRef" :floor="floorData" :theme="theme" />

      <div v-if="loading" class="overlay-msg">Cargando mapa...</div>
      <div v-else-if="error" class="overlay-msg error">{{ error }}</div>
      <div v-else-if="!map" class="overlay-msg">
        No hay mapas publicados todavía. Agregá un archivo JSON en
        <code>public/maps/</code>.
      </div>
    </main>
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

body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
  background: var(--surface);
  color: var(--text);
}

.app {
  height: 100vh;
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
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--text-muted);
  pointer-events: none;
}

.overlay-msg.error {
  color: #ef4444;
}

code {
  background: var(--surface-2);
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
