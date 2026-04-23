/** Raw scene entity from DCL Content Server */
export interface SceneEntity {
  id: string;
  type: string;
  timestamp: number;
  pointers: string[];
  content: ContentFile[];
  metadata: SceneMetadata | null;
}

export interface ContentFile {
  file: string;
  hash: string;
}

export interface SceneMetadata {
  display?: {
    title?: string;
    description?: string;
    navmapThumbnail?: string;
  };
  owner?: string;
  scene?: {
    parcels: string[];
    base: string;
  };
  main?: string;
  tags?: string[];
}

/** Processed catalog entry */
export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  owner: string;
  parcels: string[];
  baseParcel: string;
  deployedAt: number;
  glbFiles: ContentFile[];
  thumbnailHash: string | null;
  parcelCount: number;
}
