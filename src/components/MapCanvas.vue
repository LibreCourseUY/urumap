<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { renderFloor } from '../lib/render.js'

const props = defineProps({
  floor: { type: Object, default: null },
  theme: { type: String, default: 'dark' }
})

const containerRef = ref(null)
const canvasRef = ref(null)

const tileSize = ref(24)
const offset = ref({ x: 0, y: 0 })
const size = ref({ w: 0, h: 0 })

const MIN_TILE = 4
const MAX_TILE = 80
const pointers = new Map()
let panning = false
let lastPan = { x: 0, y: 0 }
let pinchStartDist = 0
let pinchStartTile = 24
let rafId = 0

const clampTile = (value) => Math.min(MAX_TILE, Math.max(MIN_TILE, value))

const draw = () => {
  const canvas = canvasRef.value
  if (!canvas || !props.floor) return
  const { w, h } = size.value
  if (w === 0 || h === 0) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  renderFloor(ctx, {
    floor: props.floor,
    tileSize: tileSize.value,
    offsetX: offset.value.x,
    offsetY: offset.value.y,
    width: w,
    height: h,
    theme: props.theme
  })
}

const scheduleDraw = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    draw()
  })
}

const fit = () => {
  if (!props.floor) return
  const { w, h } = size.value
  const pad = 40
  const ts = clampTile(Math.min((w - pad) / props.floor.width, (h - pad) / props.floor.height))
  tileSize.value = ts
  offset.value = {
    x: (w - props.floor.width * ts) / 2,
    y: (h - props.floor.height * ts) / 2
  }
  scheduleDraw()
}

const focusRoom = (row, col) => {
  if (!props.floor) return
  const { w, h } = size.value
  if (tileSize.value < 22) tileSize.value = 24
  offset.value = {
    x: w / 2 - (col + 0.5) * tileSize.value,
    y: h / 2 - (row + 0.5) * tileSize.value
  }
  scheduleDraw()
}

const distBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

const onPointerDown = (e) => {
  canvasRef.value.setPointerCapture(e.pointerId)
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
  if (pointers.size === 1) {
    panning = true
    lastPan = { x: e.clientX, y: e.clientY }
  } else if (pointers.size === 2) {
    panning = false
    const [a, b] = [...pointers.values()]
    pinchStartDist = distBetween(a, b)
    pinchStartTile = tileSize.value
  }
}

const onPointerMove = (e) => {
  if (!pointers.has(e.pointerId)) return
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()]
    const d = distBetween(a, b)
    if (pinchStartDist > 0) tileSize.value = clampTile(pinchStartTile * (d / pinchStartDist))
    scheduleDraw()
  } else if (panning) {
    offset.value = {
      x: offset.value.x + (e.clientX - lastPan.x),
      y: offset.value.y + (e.clientY - lastPan.y)
    }
    lastPan = { x: e.clientX, y: e.clientY }
    scheduleDraw()
  }
}

const onPointerUp = (e) => {
  pointers.delete(e.pointerId)
  if (pointers.size < 1) panning = false
}

const onWheel = (e) => {
  e.preventDefault()
  const rect = canvasRef.value.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
  const next = clampTile(tileSize.value * factor)
  const scale = next / tileSize.value
  offset.value = {
    x: mx - (mx - offset.value.x) * scale,
    y: my - (my - offset.value.y) * scale
  }
  tileSize.value = next
  scheduleDraw()
}

let observer
const measure = () => {
  const el = containerRef.value
  if (!el) return
  size.value = { w: el.clientWidth, h: el.clientHeight }
}

onMounted(() => {
  measure()
  observer = new ResizeObserver(() => {
    measure()
    fit()
  })
  observer.observe(containerRef.value)
  nextTick(fit)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
})

watch(
  () => props.floor,
  () => nextTick(fit)
)
watch(() => props.theme, scheduleDraw)

defineExpose({ fit, focusRoom })
</script>

<template>
  <div ref="containerRef" class="map-canvas">
    <canvas
      ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @wheel="onWheel"
    ></canvas>
  </div>
</template>

<style scoped>
.map-canvas {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}
</style>
