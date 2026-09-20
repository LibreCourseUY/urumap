<script setup>
import { ref } from 'vue'
import { appConfig } from '../config.js'

const STORAGE_KEY = 'urumap_terms_accepted'
const show = ref(!!appConfig.disclaimer && !localStorage.getItem(STORAGE_KEY))

const accept = () => {
  localStorage.setItem(STORAGE_KEY, 'true')
  show.value = false
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="overlay">
      <div class="modal">
        <h2>Aviso</h2>
        <p class="body">{{ appConfig.disclaimer }}</p>
        <button @click="accept">Acepto los términos</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal {
  background: #fff0b3;
  border: 2px solid #ffd000;
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal h2 {
  font-size: 20px;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 20px;
}

.body {
  flex: 1;
  overflow-y: auto;
  font-size: 14px;
  color: #2d2d2d;
  line-height: 1.7;
  margin-bottom: 24px;
}

button {
  padding: 14px;
  background: #ffffff;
  color: #1a1a1a;
  border: 1px solid #1a1a1a;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background: #f0f0f0;
}
</style>
