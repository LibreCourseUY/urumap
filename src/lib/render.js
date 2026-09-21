import { getTileStyles, overlayStyles } from './tileStyles.js'
import { floorRoomLabels } from './rooms.js'

const STROKE_THRESHOLD = 5
const OVERLAY_THRESHOLD = 6
const LABEL_THRESHOLD = 7

export function renderFloor(ctx, opts) {
  const {
    floor,
    tileSize,
    offsetX,
    offsetY,
    width,
    height,
    theme = 'dark',
    showGrid = true,
    route = null
  } = opts

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(offsetX, offsetY)

  const styles = getTileStyles(theme)
  const drawStroke = tileSize >= STROKE_THRESHOLD
  const drawOverlay = tileSize >= OVERLAY_THRESHOLD

  const colStart = Math.max(0, Math.floor(-offsetX / tileSize))
  const colEnd = Math.min(floor.width, Math.ceil((width - offsetX) / tileSize))
  const rowStart = Math.max(0, Math.floor(-offsetY / tileSize))
  const rowEnd = Math.min(floor.height, Math.ceil((height - offsetY) / tileSize))

  for (let row = rowStart; row < rowEnd; row++) {
    for (let col = colStart; col < colEnd; col++) {
      const style = styles[floor.base[row]?.[col]]
      if (!style) continue
      const x = col * tileSize
      const y = row * tileSize
      ctx.fillStyle = style.fill
      ctx.fillRect(x, y, tileSize, tileSize)
      if (drawStroke) {
        ctx.strokeStyle = style.stroke
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, tileSize, tileSize)
        if (style.label) {
          ctx.fillStyle = theme === 'light' ? '#1a1a1a' : '#f5f5f5'
          ctx.font = `${Math.floor(tileSize * 0.6)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(style.label, x + tileSize / 2, y + tileSize / 2)
        }
      }
    }
  }

  if (drawOverlay) {
    for (let row = rowStart; row < rowEnd; row++) {
      for (let col = colStart; col < colEnd; col++) {
        const overlay = floor.overlay?.[row]?.[col]
        if (!overlay) continue
        const style = overlayStyles[overlay]
        if (!style) continue
        const x = col * tileSize
        const y = row * tileSize
        ctx.fillStyle = style.fill
        ctx.fillRect(x, y, tileSize, tileSize)
        if (style.label) {
          ctx.fillStyle = '#fff'
          const size =
            overlay === 'exit_door' ? Math.floor(tileSize * 0.4) : Math.floor(tileSize * 0.7)
          ctx.font = `bold ${size}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(style.label, x + tileSize / 2, y + tileSize / 2)
        }
      }
    }
  }

  if (showGrid && tileSize >= 8) {
    ctx.strokeStyle = theme === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let row = rowStart; row <= rowEnd; row++) {
      ctx.moveTo(colStart * tileSize, row * tileSize)
      ctx.lineTo(colEnd * tileSize, row * tileSize)
    }
    for (let col = colStart; col <= colEnd; col++) {
      ctx.moveTo(col * tileSize, rowStart * tileSize)
      ctx.lineTo(col * tileSize, rowEnd * tileSize)
    }
    ctx.stroke()
  }

  if (route) drawRoute(ctx, { floor, tileSize, route, theme })

  if (tileSize >= LABEL_THRESHOLD) {
    for (const { label, row, col } of floorRoomLabels(floor)) {
      if (row < rowStart || row >= rowEnd || col < colStart || col >= colEnd) continue
      drawLabel(ctx, label, col * tileSize + tileSize / 2, row * tileSize + tileSize / 2, tileSize)
    }
  }

  ctx.restore()
}

function drawLabel(ctx, text, cx, cy, tileSize) {
  const fontSize = Math.max(10, Math.min(15, tileSize * 0.5))
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`
  const padX = 8
  const padY = 4
  const w = ctx.measureText(text).width + padX * 2
  const h = fontSize + padY * 2
  const x = cx - w / 2
  const y = cy - h / 2

  ctx.fillStyle = 'rgba(15, 15, 25, 0.88)'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 6)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy)
}

function strokePath(ctx, path, floorIndex, tileSize) {
  ctx.beginPath()
  let drawing = false
  for (const node of path) {
    if (node.floorIndex !== floorIndex) {
      drawing = false
      continue
    }
    const x = node.col * tileSize + tileSize / 2
    const y = node.row * tileSize + tileSize / 2
    if (drawing) ctx.lineTo(x, y)
    else {
      ctx.moveTo(x, y)
      drawing = true
    }
  }
  ctx.stroke()
}

function drawMarker(ctx, node, floorIndex, tileSize, color, label) {
  if (!node || node.floorIndex !== floorIndex) return
  const x = node.col * tileSize + tileSize / 2
  const y = node.row * tileSize + tileSize / 2
  const r = Math.max(6, tileSize * 0.34)
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#fff'
  ctx.stroke()
  if (tileSize >= 14) {
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(r * 1.1)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(label, x, y)
  }
}

// Draws the A* route for the current floor plus the origin/goal markers.
function drawRoute(ctx, { floor, tileSize, route, theme }) {
  const { path = [], start = null, goal = null } = route || {}
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.strokeStyle = theme === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(6,10,20,0.85)'
  ctx.lineWidth = Math.max(5, tileSize * 0.34)
  strokePath(ctx, path, floor.floorIndex, tileSize)

  ctx.strokeStyle = theme === 'light' ? '#2563eb' : '#60a5fa'
  ctx.lineWidth = Math.max(3, tileSize * 0.2)
  strokePath(ctx, path, floor.floorIndex, tileSize)

  drawMarker(ctx, start, floor.floorIndex, tileSize, '#22c55e', 'A')
  drawMarker(ctx, goal, floor.floorIndex, tileSize, '#ef4444', 'B')
  ctx.restore()
}
