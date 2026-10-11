import { createStarfield } from './starfield';

const universe = document.querySelector<HTMLElement>('.universe-home');

if (universe) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const canvas = universe.querySelector<HTMLCanvasElement>('.sky-starfield');
  const starfield = canvas ? createStarfield(canvas) : null;
  const scenePages = Array.from(universe.querySelectorAll<HTMLElement>('.sky-page'));
  const map = universe.querySelector<HTMLElement>('.sky-map');
  let flightTime = 0;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let sceneX = 0;
  let sceneY = 0;
  let travelWidth = 0;
  let travelHeight = 0;
  const measureTravel = () => {
    travelWidth = Math.min(72, universe.clientWidth * .045);
    travelHeight = Math.min(32, universe.clientHeight * .045);
  };
  new ResizeObserver(measureTravel).observe(universe);
  measureTravel();
  const galaxies = Array.from(universe.querySelectorAll<HTMLElement>('.sky-galaxy')).map((element) => ({
    element,
    page: element.closest<HTMLElement>('[data-sky-page]'),
    path: element.querySelector<SVGPolylineElement>('.sky-connections polyline'),
    rotation: 0,
    stars: Array.from(element.querySelectorAll<HTMLElement>('.sky-star')).map((star) => ({
      element: star,
      angle: Number(star.dataset.orbitAngle),
      radius: Number(star.dataset.orbitRadius),
    })),
  }));
  let frame = 0;
  let previousTime = 0;

  const animate = (time: number) => {
    const elapsed = previousTime ? Math.min(time - previousTime, 50) : 0;
    previousTime = time;
    flightTime += elapsed / 1000;
    const smoothing = 1 - Math.exp(-elapsed / 450);
    pointerX += (pointerTargetX - pointerX) * smoothing;
    pointerY += (pointerTargetY - pointerY) * smoothing;
    starfield?.draw(elapsed, pointerX, pointerY);
    const worldX = -Math.sin(flightTime * .13) * travelWidth + pointerX * travelWidth * .4;
    const worldY = Math.sin(flightTime * .13) * travelHeight + pointerY * travelHeight * .4;
    universe.style.setProperty('--flight-x', `${worldX}px`);
    universe.style.setProperty('--flight-y', `${worldY}px`);
    universe.style.setProperty('--flight-roll', `${Math.sin(flightTime * .055) * 5}deg`);
    if (universe.dataset.exploring !== 'true' && !map?.matches(':focus-within') && !universe.querySelector('.sky-galaxy-entry:hover, .sky-independent:hover, .sky-galaxy-caption a:hover')) {
      sceneX += (worldX - sceneX) * smoothing;
      sceneY += (worldY - sceneY) * smoothing;
      for (const page of scenePages) {
        if (page.hidden) continue;
        page.style.translate = `${sceneX.toFixed(2)}px ${sceneY.toFixed(2)}px`;
      }
    }
    for (const galaxy of galaxies) {
      if (universe.dataset.exploring === 'true' || galaxy.page?.hidden || galaxy.element.matches(':hover, :focus-within')) continue;
      galaxy.rotation = (galaxy.rotation + elapsed * Math.PI * 2 / 80000) % (Math.PI * 2);
      const points = galaxy.stars.map((star) => {
        const angle = star.angle + galaxy.rotation;
        const horizontal = 50 + Math.cos(angle) * star.radius;
        const vertical = 44 + Math.sin(angle) * star.radius * .8;
        star.element.style.setProperty('--star-x', `${horizontal.toFixed(3)}%`);
        star.element.style.setProperty('--star-y', `${vertical.toFixed(3)}%`);
        return `${horizontal.toFixed(3)},${vertical.toFixed(3)}`;
      });
      galaxy.path?.setAttribute('points', points.join(' '));
    }
    frame = requestAnimationFrame(animate);
  };

  const resetPointer = () => {
    pointerTargetX = 0;
    pointerTargetY = 0;
    universe.removeAttribute('data-pointer-active');
    universe.style.setProperty('--parallax-x', '0px');
    universe.style.setProperty('--parallax-y', '0px');
  };
  const syncMotion = () => {
    cancelAnimationFrame(frame);
    previousTime = 0;
    universe.dataset.motionPaused = String(document.hidden || reducedMotion.matches);
    if (reducedMotion.matches) {
      pointerX = 0;
      pointerY = 0;
      sceneX = 0;
      sceneY = 0;
      starfield?.draw(0, 0, 0);
      scenePages.forEach((page) => { page.style.translate = 'none'; });
      universe.style.setProperty('--flight-x', '0px');
      universe.style.setProperty('--flight-y', '0px');
      universe.style.setProperty('--flight-roll', '0deg');
    }
    if (!document.hidden && !reducedMotion.matches) frame = requestAnimationFrame(animate);
    if (reducedMotion.matches || !finePointer.matches) resetPointer();
  };
  universe.addEventListener('pointermove', (event) => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType !== 'mouse') return;
    const bounds = universe.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;
    pointerTargetX = horizontal - .5;
    pointerTargetY = vertical - .5;
    universe.dataset.pointerActive = 'true';
    universe.style.setProperty('--pointer-x', `${horizontal * 100}%`);
    universe.style.setProperty('--pointer-y', `${vertical * 100}%`);
    universe.style.setProperty('--parallax-x', `${(horizontal - .5) * 18}px`);
    universe.style.setProperty('--parallax-y', `${(vertical - .5) * 14}px`);
  }, { passive: true });
  universe.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', syncMotion);
  finePointer.addEventListener('change', syncMotion);
  window.addEventListener('pagehide', () => cancelAnimationFrame(frame));
  window.addEventListener('pageshow', syncMotion);
  syncMotion();
}
