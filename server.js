import express from 'express'
import compression from 'compression'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 8080
const dist = path.join(__dirname, 'dist')
const indexHtml = path.join(dist, 'index.html')

app.disable('x-powered-by')
app.use(compression())

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use(
  express.static(dist, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Cache-Control', 'public, max-age=300')
      }
    }
  })
)

app.get('*', (req, res) => {
  // Never answer missing files/assets with the SPA shell.
  if (path.extname(req.path)) {
    res.status(404).end()
    return
  }
  res.sendFile(indexHtml)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`UruMap listening on http://0.0.0.0:${PORT}`)
})
