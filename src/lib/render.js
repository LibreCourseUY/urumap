import { getTileStyles, overlayStyles } from './tileStyles.js'
import { floorRoomLabels } from './rooms.js'

const STROKE_THRESHOLD = 5
const OVERLAY_THRESHOLD = 6
const LABEL_THRESHOLD = 7

export function renderFloor(ctx, opts) {
  const { floor, tileSize, offsetX, offsetY, width, height, theme = 'dark', showGrid = true } = opts

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
