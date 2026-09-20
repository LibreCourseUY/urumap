<script setup>
defineProps({
  buildings: { type: Array, default: () => [] },
  currentBuilding: { type: String, default: null },
  floors: { type: Array, default: () => [] },
  current: { type: Number, default: null }
})

defineEmits(['select', 'select-building'])
</script>

<template>
  <nav class="tabs">
    <div v-if="buildings.length > 1" class="row" role="tablist" aria-label="Edificios">
      <button
        v-for="building in buildings"
        :key="building.id"
        class="chip building"
        :class="{ active: currentBuilding === building.id }"
        role="tab"
        :aria-selected="currentBuilding === building.id"
        @click="$emit('select-building', building.id)"
      >
        {{ building.name }}
      </button>
    </div>

    <div v-if="floors.length > 1" class="row" role="tablist" aria-label="Pisos">
      <button
        v-for="floor in floors"
        :key="floor.floorIndex"
        class="chip"
        :class="{ active: current === floor.floorIndex }"
        role="tab"
        :aria-selected="current === floor.floorIndex"
        @click="$emit('select', floor.floorIndex)"
      >
        {{ floor.label }}
      </button>
    </div>
  </nav>
</template>

<style scoped>
.tabs {
  flex: 0 0 auto;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  z-index: 15;
}

.row {
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.row + .row {
  padding-top: 0;
}

.row::-webkit-scrollbar {
  display: none;
}

.chip {
  flex: 0 0 auto;
  min-height: 40px;
  padding: 0.4rem 0.9rem;
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
}

.chip:hover,
.chip:focus-visible {
  background: var(--surface-3);
  outline: none;
}

.chip.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}

.chip.building {
  font-weight: 600;
}
</style>
