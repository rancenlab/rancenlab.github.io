import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from './content-files.mjs';

const root = path.join(projectRoot, 'dist');
const base = `/${(process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.xml': 'application/xml', '.json': 'application/json', '.wasm': 'application/wasm' };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (base && pathname === '/') { response.writeHead(200); response.end('ready'); return; }
    if (base && pathname !== base && !pathname.startsWith(`${base}/`)) throw new Error('Not found');
    let file = path.resolve(root, '.' + (pathname.slice(base.length) || '/'));
    if (file !== root && !file.startsWith(root + path.sep)) throw new Error('Not found');
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(await readFile(path.join(root, '404.html')));
  }
}).listen(4177, '127.0.0.1', () => console.log('Test server: http://127.0.0.1:4177'));
