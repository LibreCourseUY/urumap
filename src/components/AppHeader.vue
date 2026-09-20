<script setup>
import { ref, computed } from 'vue'
import { filterRooms } from '../lib/rooms.js'

const props = defineProps({
  appName: { type: String, required: true },
  maps: { type: Array, default: () => [] },
  selectedMap: { type: Object, default: null },
  rooms: { type: Array, default: () => [] },
  theme: { type: String, default: 'dark' }
})

const emit = defineEmits(['select-map', 'select-room', 'reset', 'toggle-theme'])

const query = ref('')
const focused = ref(false)

const results = computed(() => filterRooms(props.rooms, query.value))
const showResults = computed(() => focused.value && query.value.trim().length > 0)

const pick = (room) => {
  emit('select-room', room)
  query.value = ''
  focused.value = false
}
</script>

<template>
  <header class="header">
    <div class="top">
      <div class="brand">
        <img src="/favicon.svg" alt="" class="logo" />
        <h1>{{ appName }}</h1>
      </div>

      <div class="actions">
        <select
          v-if="maps.length > 1"
          class="map-select"
          :value="selectedMap?.id"
          @change="emit('select-map', $event.target.value)"
        >
          <option v-for="map in maps" :key="map.id" :value="map.id">{{ map.name }}</option>
        </select>

        <button class="icon-btn" @click="emit('toggle-theme')" :title="theme === 'dark' ? 'Modo claro' : 'Modo oscuro'">
          {{ theme === 'dark' ? '\u2600' : '\u263E' }}
        </button>
        <button class="icon-btn" @click="emit('reset')" title="Centrar mapa">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
          </svg>
        </button>
      </div>
    </div>

    <div class="search">
      <input
        v-model="query"
        type="search"
        placeholder="Buscar sala o espacio..."
        @focus="focused = true"
        @blur="focused = false"
      />
      <ul v-if="showResults" class="results">
        <li v-for="room in results" :key="room.id" @mousedown.prevent="pick(room)">
          <span class="name">{{ room.label }}</span>
          <span class="where">{{ room.floorLabel }}</span>
        </li>
        <li v-if="results.length === 0" class="empty">Sin resultados</li>
      </ul>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: relative;
  z-index: 1000;
  flex: 0 0 auto;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  height: 56px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.logo {
  width: 28px;
  height: 28px;
}

.brand h1 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.map-select {
  max-width: 220px;
  padding: 0.4rem 0.6rem;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
}

.icon-btn:hover {
  background: var(--surface-3);
}

.search {
  position: relative;
  padding: 0 1rem 0.7rem;
}

.search input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
}

.search input:focus {
  border-color: var(--accent);
}

.results {
  position: absolute;
  top: 100%;
  left: 1rem;
  right: 1rem;
  max-height: 300px;
  overflow-y: auto;
  list-style: none;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-top: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}

.results li:last-child {
  border-bottom: none;
}

.results li:hover {
  background: var(--surface-3);
}

.name {
  font-weight: 600;
}

.where {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.empty {
  color: var(--text-muted);
  cursor: default;
}
</style>
