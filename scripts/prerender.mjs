import { createServer } from 'http';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '..', 'dist');
const PORT = 4173;

const ROUTES = [
  '/',
  '/explore',
  '/blog',
  '/login',
  '/register',
  '/forgot-password',
  '/crowdfunding',
];

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.xml': 'text/xml',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res) {
  let path = req.url.split('?')[0];
  if (path === '/') path = '/index.html';
  const filePath = resolve(DIST, path.slice(1));
  const ext = extname(filePath);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const content = readFileSync(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(content);
}

function startServer() {
  return new Promise((resolve) => {
    const server = createServer(serveStatic).listen(PORT, () => {
      console.log(`[prerender] 🌐 Servidor estático en http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function prerenderWithBrowser() {
  let puppeteer;
  try {
    puppeteer = await import('puppeteer-core');
  } catch {
    console.log('[prerender] ⏭️ puppeteer-core no disponible — omitiendo prerender');
    return false;
  }

  const CHROME_PATHS = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  let browser;
  for (const exePath of CHROME_PATHS) {
    try {
      browser = await puppeteer.launch({
        executablePath: exePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new'],
      });
      break;
    } catch {
      continue;
    }
  }

  if (!browser) {
    console.log('[prerender] ⏭️ No se encontró Chrome/Chromium — omitiendo prerender');
    return false;
  }

  const server = await startServer();

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    for (const route of ROUTES) {
      const url = `http://localhost:${PORT}${route}`;
      process.stdout.write(`[prerender] 📄 ${route}... `);

      try {
        await page.goto(url, { waitUntil: 'networkidle0' });
        const html = await page.content();

        const outPath = route === '/'
          ? resolve(DIST, 'index.html')
          : resolve(DIST, route.slice(1), 'index.html');

        const dir = resolve(outPath, '..');
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        writeFileSync(outPath, html, 'utf-8');
        console.log(`✅`);
      } catch (err) {
        console.log(`⚠️  ${err.message}`);
      }
    }

    await browser.close();
  } finally {
    server.close();
  }

  console.log('[prerender] ✅ Prerenderizado completado');
  return true;
}

prerenderWithBrowser().catch(() => process.exit(0));
