import { crawlParcels } from './api/content-server';
import { buildCatalog } from './indexer/crawl';
import type { CatalogEntry } from './types';

const THUMB_BASE = 'https://peer.decentraland.org/content/contents';

const $status = document.getElementById('status')!;
const $count = document.getElementById('count')!;
const $grid = document.getElementById('grid')!;
const $btn = document.getElementById('crawl-btn')!;

function renderCard(entry: CatalogEntry): string {
  const thumb = entry.thumbnailHash
    ? `<img src="${THUMB_BASE}/${entry.thumbnailHash}" alt="${entry.title}" loading="lazy" />`
    : `<div class="no-thumb">No Preview</div>`;

  const date = new Date(entry.deployedAt).toLocaleDateString();
  const glbCount = entry.glbFiles.length;

  return `
    <div class="card">
      <div class="card-thumb">${thumb}</div>
      <div class="card-body">
        <h3>${entry.title}</h3>
        <p class="parcel">${entry.baseParcel} (${entry.parcelCount} parcel${entry.parcelCount > 1 ? 's' : ''})</p>
        <p class="meta">${glbCount} model${glbCount !== 1 ? 's' : ''} · ${date}</p>
      </div>
    </div>`;
}

function render(entries: CatalogEntry[]) {
  $count.textContent = `${entries.length} scenes indexed`;
  $grid.innerHTML = entries.map(renderCard).join('');
}

async function startCrawl() {
  $btn.setAttribute('disabled', '');
  $status.textContent = 'Crawling...';
  $grid.innerHTML = '';

  // Small range for prototype demo (-10 to 10 = 441 parcels)
  const entities = await crawlParcels({ min: -10, max: 10 }, (done, total, scenes) => {
    $status.textContent = `Batch ${done}/${total} — ${scenes.length} scenes found`;
  });

  const catalog = buildCatalog(entities);
  $status.textContent = 'Done';
  render(catalog);
  $btn.removeAttribute('disabled');
}

$btn.addEventListener('click', startCrawl);
