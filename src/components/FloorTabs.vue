<script setup>
defineProps({
  floors: { type: Array, default: () => [] },
  current: { type: Number, default: null }
})

defineEmits(['select'])
</script>

<template>
  <nav v-if="floors.length > 1" class="floor-tabs">
    <button
      v-for="floor in floors"
      :key="floor.floorIndex"
      :class="{ active: current === floor.floorIndex }"
      @click="$emit('select', floor.floorIndex)"
    >
      {{ floor.label }}
    </button>
  </nav>
</template>

<style scoped>
.floor-tabs {
  flex: 0 0 auto;
  position: relative;
  z-index: 900;
  display: flex;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
}

button {
  flex: 0 0 auto;
  padding: 0.35rem 0.8rem;
  background: var(--surface-2);
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
}

button:hover {
  background: var(--surface-3);
}

button.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
</style>
