<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { filterRooms } from '../lib/rooms.js'

const props = defineProps({
  rooms: { type: Array, default: () => [] }
})

const emit = defineEmits(['select'])

const query = ref('')
const open = ref(false)
const active = ref(0)
const rootRef = ref(null)
const inputRef = ref(null)

const results = computed(() => filterRooms(props.rooms, query.value, 8))

watch(results, () => {
  active.value = 0
})

const choose = (room) => {
  if (!room) return
  emit('select', room)
  query.value = ''
  open.value = false
  inputRef.value?.blur()
}

const onKeydown = (event) => {
  if (!results.value.length) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    active.value = (active.value + 1) % results.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    active.value = (active.value - 1 + results.value.length) % results.value.length
  } else if (event.key === 'Enter') {
    event.preventDefault()
    choose(results.value[active.value])
  } else if (event.key === 'Escape') {
    query.value = ''
    open.value = false
  }
}

const onClickOutside = (event) => {
  if (rootRef.value && !rootRef.value.contains(event.target)) open.value = false
}

const focus = () => {
  inputRef.value?.focus()
  open.value = true
}

defineExpose({ focus })

onMounted(() => document.addEventListener('pointerdown', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onClickOutside))
</script>

<template>
  <div ref="rootRef" class="search-bar">
    <svg class="icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z"
      />
    </svg>
    <input
      ref="inputRef"
      v-model="query"
      type="search"
      inputmode="search"
      placeholder="Buscar sala o espacio..."
      aria-label="Buscar sala"
      @focus="open = true"
      @input="open = true"
      @keydown="onKeydown"
    />
    <button v-if="query" class="clear" aria-label="Limpiar búsqueda" @click="query = ''">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          fill="currentColor"
          d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
        />
      </svg>
    </button>

    <ul v-if="open && query.trim()" class="results" role="listbox">
      <li v-for="(room, i) in results" :key="room.id">
        <button
          type="button"
          role="option"
          :aria-selected="i === active"
          :class="{ active: i === active }"
          @click="choose(room)"
          @mouseenter="active = i"
        >
          <span class="name">{{ room.label }}</span>
          <span class="where">{{ room.floorLabel }}</span>
        </button>
      </li>
      <li v-if="results.length === 0" class="empty">Sin resultados para "{{ query }}"</li>
    </ul>
  </div>
</template>

<style scoped>
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem 0.75rem;
  padding: 0 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.search-bar:focus-within {
  border-color: var(--accent);
}

.icon {
  flex: 0 0 auto;
  color: var(--text-muted);
}

input {
  flex: 1;
  min-height: 44px;
  padding: 0.5rem 0;
  font-size: 1rem;
  background: transparent;
  color: var(--text);
  border: none;
  outline: none;
}

input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--text-muted);
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.clear:hover {
  background: var(--surface-3);
  color: var(--text);
}

.results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 400;
  max-height: 55vh;
  overflow-y: auto;
  list-style: none;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  -webkit-overflow-scrolling: touch;
}

.results li button {
  width: 100%;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background: transparent;
  color: var(--text);
  border: none;
  text-align: left;
  cursor: pointer;
}

.results li button.active,
.results li button:hover {
  background: var(--surface-3);
}

.name {
  font-weight: 600;
}

.where {
  font-size: 0.82rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.empty {
  padding: 1rem;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.9rem;
}
</style>
