<script setup>
defineProps({
  mapName: { type: String, default: '' },
  theme: { type: String, default: 'dark' }
})

defineEmits(['back', 'search', 'toggle-theme', 'reset'])
</script>

<template>
  <header class="topbar">
    <button class="icon-btn" aria-label="Volver" @click="$emit('back')">
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z" />
      </svg>
    </button>

    <h1 class="title" :title="mapName">{{ mapName }}</h1>

    <div class="actions">
      <button class="icon-btn" aria-label="Buscar" @click="$emit('search')">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
        </svg>
      </button>
      <button
        class="icon-btn"
        :aria-label="theme === 'dark' ? 'Modo claro' : 'Modo oscuro'"
        @click="$emit('toggle-theme')"
      >
        <svg v-if="theme === 'dark'" viewBox="0 0 24 24" width="22" height="22">
          <path fill="currentColor" d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5h-1v3h2V2h-1zm0 17h-1v3h2v-3h-1zM2 11h3v2H2v-2zm17 0h3v2h-3v-2zM4.2 5.6 5.6 4.2l2.1 2.1-1.4 1.4L4.2 5.6zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4-2.1-2.1zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4zm12.1-12.1 2.1-2.1 1.4 1.4-2.1 2.1-1.4-1.4z" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="22" height="22">
          <path fill="currentColor" d="M12.3 2a9 9 0 1 0 9.7 9.6 7 7 0 0 1-9.7-9.6z" />
        </svg>
      </button>
      <button class="icon-btn" aria-label="Centrar mapa" @click="$emit('reset')">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path fill="currentColor" d="M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  height: calc(56px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 0.5rem 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  z-index: 20;
}

.title {
  flex: 1;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions {
  display: flex;
  gap: 0.15rem;
}

.icon-btn {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text);
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  background: var(--surface-2);
  outline: none;
}
</style>
