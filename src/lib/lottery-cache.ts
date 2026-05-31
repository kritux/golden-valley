import { promises as fs } from 'fs'
import path from 'path'

const CACHE_FILE = path.join(process.cwd(), '.lottery-cache.json')

interface LotteryCache {
  tris: { digits: string | null; date: string; updatedAt: number } | null
  daily3: { draws: unknown[]; updatedAt: number } | null
}

async function readCache(): Promise<LotteryCache> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(raw) as LotteryCache
  } catch {
    return { tris: null, daily3: null }
  }
}

async function writeCache(data: LotteryCache): Promise<void> {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // non-fatal — in-memory will still serve
  }
}

export async function getTrisCache() {
  const cache = await readCache()
  return cache.tris
}

export async function setTrisCache(digits: string, date: string) {
  const cache = await readCache()
  cache.tris = { digits, date, updatedAt: Date.now() }
  await writeCache(cache)
}

export async function getDaily3Cache() {
  const cache = await readCache()
  return cache.daily3
}

export async function setDaily3Cache(draws: unknown[]) {
  const cache = await readCache()
  cache.daily3 = { draws, updatedAt: Date.now() }
  await writeCache(cache)
}
