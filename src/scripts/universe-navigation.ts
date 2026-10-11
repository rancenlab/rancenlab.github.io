import { filterStars, slicePage } from '../lib/universe.mjs';

interface Star { title: string; href: string; tags: string[]; order: number; }
interface Galaxy { slug: string; title: string; href: string; stars: Star[]; }

const universe = document.querySelector<HTMLElement>('.universe-home');
const viewport = document.querySelector<HTMLElement>('.sky-viewport');
const world = document.querySelector<HTMLElement>('.sky-world');
const dialog = document.querySelector<HTMLDialogElement>('.galaxy-dialog');

if (universe && viewport && world && dialog) {
  const galaxies: Galaxy[] = JSON.parse(document.querySelector('#galaxy-data')?.textContent || '[]');
  const search = dialog.querySelector<HTMLInputElement>('[data-galaxy-search]')!;
  const grid = dialog.querySelector<HTMLElement>('.galaxy-article-stars')!;
  const status = dialog.querySelector<HTMLElement>('[data-article-status]')!;
  let activeGalaxy: Galaxy | undefined;
  let articlePage = 0;
  let trigger: HTMLElement | null = null;

  const renderStars = () => {
    if (!activeGalaxy) return;
    const result = slicePage(filterStars(activeGalaxy.stars, search.value), articlePage);
    articlePage = result.page;
    grid.replaceChildren();
    for (const star of result.items as Star[]) {
      const link = document.createElement('a');
      link.className = 'galaxy-article-star';
      link.href = star.href;
      const light = document.createElement('span');
      light.className = 'sky-star-light';
      light.setAttribute('aria-hidden', 'true');
      const order = document.createElement('small');
      order.textContent = `第 ${star.order} 篇`;
      const title = document.createElement('span');
      title.textContent = star.title;
      link.append(light, order, title);
      grid.append(link);
    }
    if (!result.total) {
      const empty = document.createElement('p');
      empty.className = 'galaxy-empty';
      empty.textContent = '没有找到这颗星，试试其他关键词。';
      grid.append(empty);
    }
    status.textContent = `${result.total} 篇 · ${result.page + 1} / ${result.totalPages}`;
    dialog.querySelectorAll<HTMLButtonElement>('[data-article-direction]').forEach((button) => {
      button.disabled = Number(button.dataset.articleDirection) < 0 ? result.page === 0 : result.page === result.totalPages - 1;
    });
  };

  document.querySelectorAll<HTMLAnchorElement>('[data-enter-galaxy]').forEach((link) => link.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const galaxy = galaxies.find((item) => item.slug === link.dataset.enterGalaxy);
    if (!galaxy) return;
    event.preventDefault();
    activeGalaxy = galaxy;
    trigger = link;
    articlePage = 0;
    search.value = '';
    dialog.querySelector('#galaxy-dialog-title')!.textContent = galaxy.title;
    dialog.querySelector<HTMLAnchorElement>('[data-galaxy-directory]')!.href = galaxy.href;
    renderStars();
    dialog.showModal();
    universe.dataset.exploring = 'true';
  }));
  search.addEventListener('input', () => { articlePage = 0; renderStars(); });
  dialog.querySelector('[data-close-galaxy]')?.addEventListener('click', () => dialog.close());
  dialog.querySelectorAll<HTMLButtonElement>('[data-article-direction]').forEach((button) => button.addEventListener('click', () => {
    articlePage += Number(button.dataset.articleDirection);
    renderStars();
  }));
  dialog.addEventListener('close', () => { updateView(); trigger?.focus(); });
  dialog.addEventListener('click', (event) => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let drag: { pointer: number; x: number; y: number; panX: number; panY: number } | null = null;
  const updateView = () => {
    panX = Math.max(-viewport.clientWidth * scale * .5, Math.min(viewport.clientWidth * scale * .5, panX));
    panY = Math.max(-viewport.clientHeight * scale * .5, Math.min(viewport.clientHeight * scale * .5, panY));
    world.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    document.querySelector('[data-view-scale]')!.textContent = `${Math.round(scale * 100)}%`;
    universe.dataset.exploring = String(Boolean(drag) || dialog.open || scale !== 1 || panX !== 0 || panY !== 0);
    document.querySelector<HTMLButtonElement>('[data-view-action="out"]')!.disabled = scale <= .7;
    document.querySelector<HTMLButtonElement>('[data-view-action="in"]')!.disabled = scale >= 1.8;
  };
  const zoom = (amount: number) => { scale = Math.max(.7, Math.min(1.8, Math.round((scale + amount) * 10) / 10)); updateView(); };
  const reset = () => { scale = 1; panX = 0; panY = 0; updateView(); };
  document.querySelectorAll<HTMLButtonElement>('[data-view-action]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.viewAction === 'reset') reset();
    else zoom(button.dataset.viewAction === 'in' ? .1 : -.1);
  }));
  document.addEventListener('sky:reset-view', reset);
  viewport.addEventListener('wheel', (event) => {
    if (event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    zoom(event.deltaY < 0 ? .1 : -.1);
  }, { passive: false });
  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target as Element).closest('a, button, input') || drag) return;
    drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, panX, panY };
    viewport.setPointerCapture(event.pointerId);
    viewport.dataset.dragging = 'true';
    updateView();
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    panX = drag.panX + event.clientX - drag.x;
    panY = drag.panY + event.clientY - drag.y;
    updateView();
  });
  const endDrag = () => { drag = null; delete viewport.dataset.dragging; updateView(); };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);
  viewport.addEventListener('keydown', (event) => {
    if (event.target !== viewport) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-30, 0], ArrowRight: [30, 0], ArrowUp: [0, -30], ArrowDown: [0, 30] };
    if (moves[event.key]) { event.preventDefault(); panX += moves[event.key][0]; panY += moves[event.key][1]; updateView(); }
    else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(.1); }
    else if (event.key === '-') { event.preventDefault(); zoom(-.1); }
    else if (event.key === '0') { event.preventDefault(); reset(); }
  });
  new ResizeObserver(updateView).observe(viewport);
  updateView();
}
