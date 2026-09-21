import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(full)))
    else if (entry.name.endsWith('.json') && entry.name !== 'index.json') files.push(full)
  }
  return files
}

export function toId(relativePath) {
  return relativePath
    .replace(/\.json$/, '')
    .split(sep)
    .join('-')
}

export async function buildEntry(mapsDir, file) {
  const relativePath = relative(mapsDir, file).split(sep).join('/')
  const raw = JSON.parse(await readFile(file, 'utf8'))
  const map = raw && raw.map && Array.isArray(raw.map.floors) ? raw.map : raw
  return {
    id: map.id || toId(relativePath),
    name: map.name || relativePath,
    description: map.description || '',
    region: map.region || '',
    floorCount: Array.isArray(map.floors) ? map.floors.length : 0,
    buildingCount: Array.isArray(map.buildings) ? map.buildings.length : 1,
    updatedAt: map.updatedAt || '',
    file: `maps/${relativePath}`
  }
}

export async function buildIndex(mapsDir) {
  const files = await walk(mapsDir)
  const entries = await Promise.all(files.map((file) => buildEntry(mapsDir, file)))
  entries.sort((a, b) => a.name.localeCompare(b.name))
  return entries
}

const mapsDir = fileURLToPath(new URL('../public/maps/', import.meta.url))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const entries = await buildIndex(mapsDir)
  const outPath = join(mapsDir, 'index.json')
  await writeFile(outPath, JSON.stringify(entries, null, 2) + '\n')
  console.log(`map index: ${entries.length} map(s) -> ${relative(process.cwd(), outPath)}`)
}
