import type { SceneEntity, CatalogEntry, ContentFile } from '../types';

/** Convert a raw SceneEntity into a CatalogEntry */
export function toEntry(entity: SceneEntity): CatalogEntry | null {
  const meta = entity.metadata;
  if (!meta?.scene) return null;

  const glbFiles: ContentFile[] = entity.content.filter(
    (f) => f.file.endsWith('.glb') || f.file.endsWith('.gltf'),
  );

  const thumbFile = entity.content.find(
    (f) => f.file === meta.display?.navmapThumbnail,
  );

  return {
    id: entity.id,
    title: meta.display?.title || 'Untitled',
    description: meta.display?.description || '',
    owner: meta.owner || 'unknown',
    parcels: meta.scene.parcels,
    baseParcel: meta.scene.base,
    deployedAt: entity.timestamp,
    glbFiles,
    thumbnailHash: thumbFile?.hash ?? null,
    parcelCount: meta.scene.parcels.length,
  };
}

/** Process raw entities into catalog entries */
export function buildCatalog(entities: SceneEntity[]): CatalogEntry[] {
  return entities
    .map(toEntry)
    .filter((e): e is CatalogEntry => e !== null)
    .sort((a, b) => b.deployedAt - a.deployedAt);
}
