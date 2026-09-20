<script setup>
defineProps({
  appName: { type: String, required: true },
  description: { type: String, default: '' },
  maps: { type: Array, default: () => [] }
})

defineEmits(['select'])
</script>

<template>
  <div class="catalog">
    <header class="catalog-header">
      <img src="/favicon.svg" alt="" class="logo" />
      <div>
        <h1>{{ appName }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
    </header>

    <ul v-if="maps.length" class="catalog-list">
      <li v-for="map in maps" :key="map.id">
        <button class="card" @click="$emit('select', map.id)">
          <span class="card-title">{{ map.name }}</span>
          <span v-if="map.region" class="card-region">{{ map.region }}</span>
          <span v-if="map.description" class="card-desc">{{ map.description }}</span>
          <span class="card-meta">
            <span v-if="map.floorCount">{{ map.floorCount }} piso{{ map.floorCount > 1 ? 's' : '' }}</span>
            <span v-if="map.buildingCount > 1">{{ map.buildingCount }} edificios</span>
          </span>
        </button>
      </li>
    </ul>

    <p v-else class="catalog-empty">
      No hay mapas publicados todavía. Agregá un archivo JSON en <code>public/maps/</code>.
    </p>
  </div>
</template>

<style scoped>
.catalog {
  flex: 1;
  overflow-y: auto;
  padding: max(1rem, env(safe-area-inset-top)) 1rem calc(2rem + env(safe-area-inset-bottom));
  -webkit-overflow-scrolling: touch;
}

.catalog-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0.5rem 0 1.25rem;
}

.logo {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
}

.catalog-header h1 {
  font-size: 1.4rem;
  line-height: 1.2;
}

.catalog-header p {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-top: 0.15rem;
}

.catalog-list {
  list-style: none;
  display: grid;
  gap: 0.75rem;
}

.card {
  width: 100%;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 1rem;
  text-align: left;
  background: var(--surface-2);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.card:active {
  transform: scale(0.99);
}

.card:hover,
.card:focus-visible {
  background: var(--surface-3);
  border-color: var(--accent);
  outline: none;
}

.card-title {
  font-size: 1.05rem;
  font-weight: 600;
}

.card-region {
  font-size: 0.8rem;
  color: var(--accent);
  font-weight: 600;
}

.card-desc {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.card-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.catalog-empty {
  color: var(--text-muted);
  text-align: center;
  padding: 3rem 1rem;
  line-height: 1.7;
}

@media (min-width: 640px) {
  .catalog {
    padding-inline: 1.5rem;
  }

  .catalog-list {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .catalog {
    max-width: 900px;
    margin: 0 auto;
  }

  .catalog-list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
