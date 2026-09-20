import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const mapsDir = fileURLToPath(new URL('../public/maps/', import.meta.url))

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.name.endsWith('.json') && entry.name !== 'index.json') files.push(full)
  }
  return files
}

function toId(relativePath) {
  return relativePath.replace(/\.json$/, '').split(sep).join('-')
}

async function buildEntry(file) {
  const relativePath = relative(mapsDir, file).split(sep).join('/')
  const raw = JSON.parse(await readFile(file, 'utf8'))
  const map = raw && raw.map && Array.isArray(raw.map.floors) ? raw.map : raw
  return {
    id: map.id || toId(relativePath),
    name: map.name || relativePath,
    description: map.description || '',
    region: map.region || '',
    file: `maps/${relativePath}`
  }
}

const files = await walk(mapsDir)
const entries = await Promise.all(files.map(buildEntry))
entries.sort((a, b) => a.name.localeCompare(b.name))

const outPath = join(mapsDir, 'index.json')
await writeFile(outPath, JSON.stringify(entries, null, 2) + '\n')
console.log(`map index: ${entries.length} map(s) -> ${relative(process.cwd(), outPath)}`)
