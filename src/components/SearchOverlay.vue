<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { filterRooms } from '../lib/rooms.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  rooms: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'close'])

const query = ref('')
const inputRef = ref(null)
const overlayRef = ref(null)

const results = computed(() => filterRooms(props.rooms, query.value, 40))

watch(
  () => props.open,
  async (open) => {
    if (open) {
      query.value = ''
      await nextTick()
      inputRef.value?.focus()
    }
  }
)

const pick = (room) => emit('select', room)

const onKeydown = (e) => {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  if (e.key !== 'Tab' || !overlayRef.value) return
  const focusable = overlayRef.value.querySelectorAll('input, button')
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        ref="overlayRef"
        class="overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Buscar sala"
        @keydown="onKeydown"
      >
        <div class="bar">
          <input
            ref="inputRef"
            v-model="query"
            type="search"
            inputmode="search"
            placeholder="Buscar sala o espacio..."
            aria-label="Buscar sala"
          />
          <button class="close" aria-label="Cerrar búsqueda" @click="$emit('close')">
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="currentColor"
                d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        <ul v-if="query.trim()" class="results">
          <li v-for="room in results" :key="room.id">
            <button @click="pick(room)">
              <span class="name">{{ room.label }}</span>
              <span class="where">{{ room.floorLabel }}</span>
            </button>
          </li>
          <li v-if="results.length === 0" class="empty">Sin resultados para "{{ query }}"</li>
        </ul>
        <p v-else class="hint">Escribí para buscar una sala por nombre.</p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: var(--surface);
  display: flex;
  flex-direction: column;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
}

.bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid var(--border);
}

.bar input {
  flex: 1;
  min-height: 44px;
  padding: 0.6rem 0.9rem;
  font-size: 1rem;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 12px;
  outline: none;
}

.bar input:focus {
  border-color: var(--accent);
}

.close {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text);
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.results {
  list-style: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.results li button {
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.8rem 1rem;
  background: transparent;
  color: var(--text);
  border: none;
  border-bottom: 1px solid var(--border);
  text-align: left;
  cursor: pointer;
}

.results li button:hover,
.results li button:focus-visible {
  background: var(--surface-2);
  outline: none;
}

.name {
  font-weight: 600;
}

.where {
  font-size: 0.82rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.empty,
.hint {
  padding: 2rem 1.25rem;
  color: var(--text-muted);
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
