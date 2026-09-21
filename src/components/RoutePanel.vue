<script setup>
defineProps({
  origin: { type: Object, default: null },
  goal: { type: Object, default: null },
  result: { type: Object, default: null },
  options: { type: Object, required: true },
  picking: { type: Boolean, default: false },
  currentFloor: { type: Number, default: null }
})

const emit = defineEmits(['pick-origin', 'clear', 'update:options', 'go-to'])

const setOption = (key, value, options) => {
  emit('update:options', { ...options, [key]: value })
}
</script>

<template>
  <section class="route" aria-label="Ruta">
    <div class="row">
      <span class="dot start" aria-hidden="true">A</span>
      <div class="text">
        <div class="label">Desde</div>
        <div class="value">{{ origin?.label || 'Sin definir' }}</div>
      </div>
      <button class="pick" :class="{ active: picking }" type="button" @click="$emit('pick-origin')">
        {{ picking ? 'Tocá el mapa…' : 'Marcar' }}
      </button>
    </div>

    <div class="row">
      <span class="dot goal" aria-hidden="true">B</span>
      <div class="text">
        <div class="label">Hasta</div>
        <div class="value">{{ goal?.label || 'Elegí una sala en el buscador' }}</div>
      </div>
    </div>

    <p v-if="result && !result.found" class="status warn">No se encontró un camino.</p>
    <div v-else-if="result && result.found" class="status ok">
      <span>{{ result.path.length }} pasos</span>
      <span v-if="result.floorChanges">
        · {{ result.floorChanges }} cambio{{ result.floorChanges > 1 ? 's' : '' }} de piso
      </span>
      <button
        v-if="goal && goal.floor !== currentFloor"
        type="button"
        class="jump"
        @click="$emit('go-to', goal.floor)"
      >
        Ir a {{ goal.floorLabel }}
      </button>
    </div>

    <details class="options">
      <summary>Opciones</summary>
      <label>
        <input
          type="checkbox"
          :checked="options.accessibleOnly"
          @change="setOption('accessibleOnly', $event.target.checked, options)"
        />
        Sólo accesible
      </label>
      <label>
        <input
          type="checkbox"
          :checked="options.preferElevator"
          @change="setOption('preferElevator', $event.target.checked, options)"
        />
        Preferir ascensor
      </label>
      <label>
        <input
          type="checkbox"
          :checked="options.noOutside"
          @change="setOption('noOutside', $event.target.checked, options)"
        />
        Evitar exterior
      </label>
    </details>

    <button class="clear" type="button" @click="$emit('clear')">Limpiar ruta</button>
  </section>
</template>

<style scoped>
.route {
  margin: 0 0.75rem 0.5rem;
  padding: 0.6rem 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.9rem;
}

.row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.25rem 0;
}

.dot {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
}

.dot.start {
  background: #22c55e;
}

.dot.goal {
  background: #ef4444;
}

.text {
  flex: 1;
  min-width: 0;
}

.label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.value {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pick {
  flex: 0 0 auto;
  padding: 0.4rem 0.7rem;
  background: var(--surface-3);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.pick.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding-top: 0.35rem;
}

.status.ok {
  color: var(--text);
}

.status.warn {
  color: #f87171;
}

.jump {
  margin-left: auto;
  padding: 0.3rem 0.6rem;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.78rem;
  cursor: pointer;
}

.options {
  margin-top: 0.4rem;
  color: var(--text-muted);
}

.options summary {
  cursor: pointer;
  font-size: 0.82rem;
}

.options label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0;
}

.clear {
  margin-top: 0.4rem;
  padding: 0.4rem 0.7rem;
  width: 100%;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
}

.clear:hover {
  color: var(--text);
  background: var(--surface-3);
}
</style>
