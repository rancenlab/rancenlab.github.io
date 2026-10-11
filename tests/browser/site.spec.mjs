import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const target = (route = '') => `${base}/${route}`;

test('首页、导航与移动布局', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(target());
  await expect(page.getByRole('heading', { level: 1 })).toContainText('让思考，连成宇宙');
  await expect(page.locator('.sky-galaxy')).toHaveCount(1);
  await expect(page.locator('.sky-star')).toHaveCount(3);
  await expect(page.locator('.post-list, .subscribe-banner')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 2)).toBe(true);
  await mkdir('artifacts', { recursive: true });
  await page.screenshot({ path: `artifacts/home-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '标签', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('关键词');
  expect(errors).toEqual([]);
});

test('主题支持键盘切换，跨页面与刷新保留选择', async ({ page }, testInfo) => {
  await page.goto(target());
  const root = page.locator('html');
  const toggle = page.getByRole('button', { name: '深空主题', exact: true });
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: `artifacts/theme-light-${testInfo.project.name}.png` });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#07080e');
  await page.screenshot({ path: `artifacts/theme-dark-${testInfo.project.name}.png` });
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '个人主页' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await page.goto(target('posts/power-grid-basics/'));
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.prose')).toHaveCSS('color', 'rgb(73, 82, 106)');
  await page.reload();
  await expect(root).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute('content', 'light');
});

test('浏览器存储不可用时仍可切换主题', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.goto(target());
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: '深空主题', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: '深空主题', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('知识星图按系列聚合文章，星星和星系可以进入阅读', async ({ page }) => {
  await page.goto(target());
  const universe = page.getByRole('region', { name: '知识星图' });
  await expect(universe.locator('.sky-star')).toHaveCount(3);
  await expect(universe.locator('.sky-independent')).toHaveCount(0);
  await expect(universe.locator('.sky-count')).toHaveText('1 个星系 · 8 颗星');
  await expect(universe.locator('a[href*="draft-example"]')).toHaveCount(0);
  const galaxy = universe.getByRole('region', { name: '电力交易' });
  const entry = galaxy.getByRole('link', { name: '展开星系：电力交易' });
  await entry.focus();
  await entry.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(6);
  await dialog.getByRole('button', { name: '下一组' }).click();
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(2);
  await expect(dialog.locator('.galaxy-article-star').last()).toContainText('电价的组成');
  await dialog.getByRole('button', { name: '上一组' }).click();
  await expect(dialog.locator('.galaxy-article-star').first()).toHaveAttribute('href', target('posts/electricity-market-guide/'));
  await dialog.locator('.galaxy-article-star').first().click();
  await expect(page).toHaveURL(new RegExp('/posts/electricity-market-guide/$'));
  await page.goBack();
  await galaxy.getByRole('heading').getByRole('link').focus();
  await galaxy.getByRole('heading').getByRole('link').click();
  await dialog.getByRole('link', { name: '系列目录' }).click();
  await expect(page).toHaveURL(new RegExp('/series/electricity-trading/$'));
});

test('星星持续公转，聚焦暂停，减少动态效果设置生效', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(target());
  const star = page.locator('.sky-star').first();
  const position = () => star.evaluate((element) => element.style.getPropertyValue('--star-x'));
  const initial = await position();
  await expect.poll(position).not.toBe(initial);
  const entry = page.locator('.sky-galaxy-entry').first();
  await entry.focus();
  await expect(entry.locator('span').last()).toHaveCSS('opacity', '1');
  const focused = await position();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await position()).toBe(focused);
  await expect(entry.locator('.sky-star-light')).toHaveCSS('transform', 'matrix(1.4, 0, 0, 1.4, 0, 0)');
  await page.screenshot({ path: `artifacts/star-focus-${testInfo.project.name}.png` });
  await entry.evaluate((element) => element.blur());
  await expect.poll(position).not.toBe(focused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.universe-home')).toHaveAttribute('data-motion-paused', 'true');
  const stopped = await position();
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await position()).toBe(stopped);
  await expect(page.locator('.sky-galaxy-dust')).toHaveCSS('animation-name', 'none');
  await expect(page.locator('.sky-meteors')).toBeHidden();
  await entry.click();
  await page.locator('.galaxy-article-star').first().click();
  await expect(page).toHaveURL(new RegExp('/posts/electricity-market-guide/$'));
});

test('鼠标悬停星系与星星产生反馈并保持可点击', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', '触屏使用聚焦与点击反馈');
  await page.goto(target());
  const galaxyBounds = await page.locator('.sky-galaxy').boundingBox();
  await page.mouse.move(galaxyBounds.x + 15, galaxyBounds.y + 15);
  const scenePosition = () => page.locator('.sky-page').first().evaluate((element) => element.style.translate);
  const beforeHover = await scenePosition();
  await expect.poll(scenePosition).not.toBe(beforeHover);
  const star = page.locator('.sky-star').first();
  const entry = page.locator('.sky-galaxy-entry').first();
  const starBounds = await entry.boundingBox();
  await page.mouse.move(starBounds.x + starBounds.width / 2, starBounds.y + starBounds.height / 2);
  await expect(entry.locator('span').last()).toHaveCSS('opacity', '1');
  await expect(page.locator('.sky-galaxy-dust')).toHaveCSS('opacity', '0.95');
  await expect(page.locator('.universe-home')).toHaveAttribute('data-pointer-active', 'true');
  const pausedScene = await scenePosition();
  const position = await star.evaluate((element) => element.style.getPropertyValue('--star-x'));
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  expect(await star.evaluate((element) => element.style.getPropertyValue('--star-x'))).toBe(position);
  expect(await scenePosition()).toBe(pausedScene);
  await page.screenshot({ path: 'artifacts/star-hover-desktop.png' });
  await entry.click();
  await page.locator('.galaxy-article-star').first().click();
  await expect(page).toHaveURL(new RegExp('/posts/electricity-market-guide/$'));
});

test.describe('全景宇宙运动', () => {
  test('独立星光测试夹具与星系保持相对位置并共同位移', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(target());
    await page.evaluate((href) => {
      const star = document.createElement('a');
      star.className = 'sky-independent';
      star.href = href;
      star.style.cssText = '--object-x: 74%; --object-y: 62%; --object-order: 1;';
      star.innerHTML = '<span class="sky-star-light" aria-hidden="true"></span><span class="sky-independent-label"><small>独立星光</small><span>交互测试夹具</span></span>';
      document.querySelector('.sky-page').append(star);
    }, target('posts/electricity-market-economics/'));
    const positions = () => page.evaluate(() => {
      const galaxy = document.querySelector('.sky-galaxy').getBoundingClientRect();
      const star = document.querySelector('.sky-independent .sky-star-light').getBoundingClientRect();
      return { galaxyX: galaxy.x, galaxyY: galaxy.y, starX: star.x, starY: star.y };
    });
    const before = await positions();
    await expect.poll(async () => Math.abs((await positions()).galaxyX - before.galaxyX)).toBeGreaterThan(2);
    const after = await positions();
    expect(after.starX - before.starX).toBeCloseTo(after.galaxyX - before.galaxyX, 1);
    expect(after.starY - before.starY).toBeCloseTo(after.galaxyY - before.galaxyY, 1);
    await expect(page.locator('.sky-independent .sky-star-light')).toHaveCSS('animation-name', 'none');
    await page.locator('.sky-independent').focus();
    await page.locator('.sky-independent').click();
    await expect(page).toHaveURL(new RegExp('/posts/electricity-market-economics/$'));
  });

  test('背景星海与前景共同流动，阅读时只暂停前景', async ({ page }, testInfo) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(target());
    const canvas = page.locator('.sky-starfield');
    const scene = page.locator('.sky-page').first();
    const image = () => canvas.evaluate((element) => element.toDataURL());
    const translate = () => scene.evaluate((element) => element.style.translate);
    const initialImage = await image();
    const initialScene = await translate();
    await expect.poll(async () => (await image()) !== initialImage).toBe(true);
    await expect.poll(translate).not.toBe(initialScene);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `artifacts/universe-flight-${testInfo.project.name}.png` });
    const star = page.locator('.sky-galaxy-entry').first();
    await star.focus();
    const pausedScene = await translate();
    const readingImage = await image();
    await page.waitForTimeout(1800);
    expect(await translate()).toBe(pausedScene);
    expect((await image()) !== readingImage).toBe(true);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.universe-home')).toHaveAttribute('data-motion-paused', 'true');
    const stillImage = await image();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    expect((await image()) === stillImage).toBe(true);
    await expect(scene).toHaveCSS('translate', 'none');
  });
});

test('分层星系支持筛选、返回与视角控制', async ({ page }, testInfo) => {
  await page.goto(target());
  await page.getByRole('button', { name: '放大星图' }).click();
  await expect(page.locator('[data-view-scale]')).toHaveText('110%');
  const viewport = page.getByRole('region', { name: '知识星图' }).locator('.sky-viewport');
  await viewport.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.sky-world')).toHaveCSS('transform', 'matrix(1.1, 0, 0, 1.1, 30, 0)');
  await page.getByRole('button', { name: '复位', exact: true }).click();
  await expect(page.locator('[data-view-scale]')).toHaveText('100%');
  await expect(page.locator('.sky-world')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)');
  if (testInfo.project.name === 'desktop') {
    const bounds = await viewport.boundingBox();
    await page.mouse.move(bounds.x + 30, bounds.y + bounds.height * .8);
    await page.mouse.down();
    await page.mouse.move(bounds.x + 100, bounds.y + bounds.height * .8 + 20, { steps: 5 });
    await page.mouse.up();
    await expect(page.locator('.sky-world')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 70, 20)');
    await page.getByRole('button', { name: '复位', exact: true }).click();
  }
  const entry = page.getByRole('link', { name: '展开星系：电力交易' });
  await entry.focus();
  await entry.click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox', { name: '查找星星' }).fill('电价');
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(1);
  await expect(dialog.locator('.galaxy-article-star')).toContainText('电价的组成：从交易价格到电费账单');
  await dialog.getByRole('searchbox').fill('不存在的星星');
  await expect(dialog.locator('.galaxy-empty')).toBeVisible();
  await dialog.getByRole('searchbox').fill('');
  await page.screenshot({ path: `artifacts/galaxy-expanded-${testInfo.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(entry).toBeFocused();
  await page.getByRole('link', { name: '搜索星空' }).click();
  await expect(page).toHaveURL(new RegExp('/search/$'));
});

test('大量文章的星系每组最多六颗星且可访问末页', async ({ page }) => {
  await page.route(`**${target()}`, async (route) => {
    const response = await route.fetch();
    const html = await response.text();
    const pattern = /(<script\b[^>]*\bid="galaxy-data"[^>]*>)([\s\S]*?)(<\/script>)/;
    const match = html.match(pattern);
    const data = JSON.parse(match[2]);
    data[0].stars = Array.from({ length: 19 }, (_, index) => ({ ...data[0].stars[0], title: `测试文章 ${index + 1}`, order: index + 1 }));
    await route.fulfill({ response, body: html.replace(pattern, (_match, start, _json, end) => `${start}${JSON.stringify(data)}${end}`) });
  });
  await page.goto(target());
  await page.locator('.sky-galaxy-entry').focus();
  await page.locator('.sky-galaxy-entry').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(6);
  for (let index = 0; index < 3; index++) await dialog.getByRole('button', { name: '下一组' }).click();
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(1);
  await expect(dialog.locator('.galaxy-article-star')).toContainText('测试文章 19');
  await expect(dialog.getByRole('button', { name: '下一组' })).toBeDisabled();
  await dialog.getByRole('searchbox').fill('测试文章 19');
  await expect(dialog.locator('.galaxy-article-star')).toHaveCount(1);
  await expect(dialog.locator('[data-article-status]')).toContainText('1 / 1');
  await dialog.getByRole('button', { name: '返回宇宙' }).click();
  await expect(dialog).not.toBeVisible();
});

test('个人主页、手记入口与友好 RSS 订阅页有效', async ({ page, request }) => {
  await page.goto(target());
  await page.getByRole('navigation', { name: '主导航' }).getByRole('link', { name: '个人主页' }).click();
  await expect(page).toHaveURL(new RegExp('/about/$'));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Raycen');
  await expect(page.getByText('我的学习方式')).toBeVisible();

  await page.goto(target());
  await page.getByRole('link', { name: '全部文章' }).click();
  await expect(page).toHaveURL(new RegExp('/posts/$'));

  await page.goto(target('subscribe/'));
  await expect(page.getByRole('heading', { level: 1 })).toContainText('保持好奇，也保持连接');
  await expect(page.getByText('订阅知行手记')).toBeVisible();
  await expect(page.locator('#feed-address')).toHaveValue(/rss\.xml/);
  const rss = await request.get(target('rss.xml'));
  expect(rss.ok()).toBe(true);
  expect(rss.headers()['content-type']).toContain('xml');
  expect(await rss.text()).toContain('<rss');
});

test('系列顺序和上一篇、下一篇保持一致', async ({ page }) => {
  await page.goto(target('series/electricity-trading/'));
  await expect(page.locator('.chapter')).toHaveCount(8);
  await page.locator('.chapter').first().click();
  await expect(page).toHaveURL(new RegExp('/posts/electricity-market-guide/$'));
  await expect(page.getByRole('navigation', { name: '系列上下篇' }).getByRole('link')).toHaveCount(1);
  await page.getByRole('navigation', { name: '系列上下篇' }).getByRole('link').click();
  await expect(page).toHaveURL(new RegExp('/posts/power-grid-basics/$'));
  await expect(page.getByRole('navigation', { name: '系列上下篇' }).getByRole('link')).toHaveCount(2);
});

test('中文、英文搜索有效，旧测试内容不可检索', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(target('search/'));
  const input = page.getByRole('searchbox');
  await input.fill('kWh');
  await expect(page.locator('#search-status')).toContainText('找到');
  await expect(page.locator('#search-results li').first()).toBeVisible();
  await input.fill('电价');
  await expect(page.locator('#search-results')).toContainText('电价的组成：从交易价格到电费账单');
  await page.locator('#search-results a').filter({ hasText: '电价的组成：从交易价格到电费账单' }).click();
  await expect(page).toHaveURL(new RegExp('/posts/electricity-price-components/$'));
  await page.goto(target('search/'));
  await input.fill('"UNPUBLISHEDCANARYXQZ"');
  await expect(page.locator('#search-status')).toContainText('暂时没有找到');
  await expect(page.locator('#search-results li')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('文章图片与代码可读，窄屏不溢出', async ({ page, context }, testInfo) => {
  await page.goto(target('posts/power-grid-basics/'));
  const image = page.locator('.prose img');
  await expect(image).toBeVisible();
  expect(await image.evaluate((element) => element.complete && element.naturalWidth > 0)).toBe(true);
  await expect(page.getByRole('button', { name: '复制代码' })).toHaveCount(1);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: '复制代码' }).click();
  await expect(page.getByRole('button', { name: '复制代码' })).toHaveText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('电能量（kWh）');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `artifacts/article-${testInfo.project.name}.png`, fullPage: true });
  await page.goto(target('posts/electricity-price-components/'));
  await expect(page.getByRole('navigation', { name: '系列上下篇' }).getByRole('link')).toHaveCount(1);
  await expect(page.locator('.prose table')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('旧测试内容返回 404，订阅与站点地图只含新专题', async ({ request }) => {
  const removedRoutes = ['posts/start-with-markdown/', 'posts/organize-a-series/', 'posts/images-and-publishing/', 'posts/write-a-useful-note/', 'posts/draft-example/', 'series/build-a-learning-blog/'];
  for (const route of removedRoutes) {
    const response = await request.get(target(route));
    expect(response.status(), route).toBe(404);
  }
  const rss = await request.get(target('rss.xml'));
  expect(rss.ok()).toBe(true);
  const body = await rss.text();
  expect(body.match(/<item>/g)).toHaveLength(8);
  expect(body).toContain('电力交易导读');
  for (const route of removedRoutes) expect(body).not.toContain(route);
  const map = await request.get(target('sitemap-0.xml'));
  expect(map.ok()).toBe(true);
  const sitemap = await map.text();
  for (const route of removedRoutes) expect(sitemap).not.toContain(route);
  expect(sitemap).toContain('/series/electricity-trading/');
});
