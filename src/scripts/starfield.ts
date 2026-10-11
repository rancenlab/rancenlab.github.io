export function createStarfield(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return { draw: () => {} };
  let width = 1;
  let height = 1;
  let clock = 0;
  let pointerX = 0;
  let pointerY = 0;
  let dark = document.documentElement.dataset.theme === 'dark';
  let seed = 73;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const stars = Array.from({ length: 190 }, () => ({
    horizontal: random(), vertical: random(), depth: .25 + random() * .75,
    radius: .4 + random() * 1.1, phase: random() * Math.PI * 2,
  }));
  const wrap = (value: number, size: number) => ((value % size) + size) % size;
  const paint = () => {
    context.clearRect(0, 0, width, height);
    const density = Math.min(stars.length, Math.max(65, Math.round(width * height / 6000)));
    for (const star of stars.slice(0, density)) {
      const speed = 7 + star.depth * 23;
      const horizontal = wrap(star.horizontal * (width + 80) - clock * speed + pointerX * star.depth * 32, width + 80) - 40;
      const vertical = wrap(star.vertical * (height + 80) + clock * speed * .24 + Math.sin(clock * .12 + star.phase) * 14 + pointerY * star.depth * 24, height + 80) - 40;
      const opacity = (.3 + star.depth * .45) * (.8 + Math.sin(clock * .8 + star.phase) * .2);
      context.strokeStyle = dark ? `rgba(201, 203, 245, ${opacity * .3})` : `rgba(130, 119, 180, ${opacity * .27})`;
      context.lineWidth = star.radius * .65;
      context.beginPath();
      context.moveTo(horizontal + star.depth * 9, vertical - star.depth * 2);
      context.lineTo(horizontal, vertical);
      context.stroke();
      context.fillStyle = dark ? `rgba(218, 221, 255, ${opacity})` : `rgba(112, 103, 165, ${opacity * .7})`;
      context.beginPath();
      context.arc(horizontal, vertical, star.radius * (.65 + star.depth * .5), 0, Math.PI * 2);
      context.fill();
      if (star.depth > .9) {
        context.fillStyle = dark ? 'rgba(190, 183, 255, .055)' : 'rgba(161, 140, 211, .06)';
        context.beginPath();
        context.arc(horizontal, vertical, star.radius * 4, 0, Math.PI * 2);
        context.fill();
      }
    }
  };
  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint();
  };
  new ResizeObserver(resize).observe(canvas);
  new MutationObserver(() => {
    dark = document.documentElement.dataset.theme === 'dark';
    paint();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  resize();
  return {
    draw(elapsed: number, horizontal: number, vertical: number) {
      clock += elapsed / 1000;
      pointerX = horizontal;
      pointerY = vertical;
      paint();
    },
  };
}
