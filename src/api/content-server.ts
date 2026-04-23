import type { SceneEntity } from '../types';

const BASE = '/api/content';
const BATCH_SIZE = 200;

/** Fetch active scene entities for a batch of parcel pointers */
export async function fetchActiveEntities(pointers: string[]): Promise<SceneEntity[]> {
  const res = await fetch(`${BASE}/entities/active`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pointers }),
  });
  if (!res.ok) throw new Error(`Content Server error: ${res.status}`);
  return res.json();
}

/** Generate parcel coordinate strings for a given range */
export function generatePointers(min: number, max: number): string[] {
  const pointers: string[] = [];
  for (let x = min; x <= max; x++) {
    for (let y = min; y <= max; y++) {
      pointers.push(`${x},${y}`);
    }
  }
  return pointers;
}

/** Split array into chunks */
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** Crawl a range of parcels, calling onProgress for each batch */
export async function crawlParcels(
  range: { min: number; max: number },
  onProgress?: (done: number, total: number, scenes: SceneEntity[]) => void,
): Promise<SceneEntity[]> {
  const pointers = generatePointers(range.min, range.max);
  const batches = chunk(pointers, BATCH_SIZE);
  const seen = new Set<string>();
  const allScenes: SceneEntity[] = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]!;
    try {
      const entities = await fetchActiveEntities(batch);
      for (const entity of entities) {
        if (!seen.has(entity.id)) {
          seen.add(entity.id);
          allScenes.push(entity);
        }
      }
    } catch (e) {
      console.warn(`Batch ${i + 1} failed:`, e);
    }
    onProgress?.(i + 1, batches.length, allScenes);
  }

  return allScenes;
}
