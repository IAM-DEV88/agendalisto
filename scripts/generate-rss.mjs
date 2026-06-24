/**
 * generate-rss.mjs — Genera el RSS feed del blog de AgendaYa
 *
 * Dependencias: dotenv (instalada como devDep), supabase-js (instalada)
 * Se ejecuta después del build: node scripts/generate-rss.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env manualmente si estamos fuera de Vite
let supabaseUrl = process.env.VITE_SUPABASE_URL;
let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

// Fallback: leer el .env del proyecto
if (!supabaseUrl || !supabaseKey) {
  const envPath = resolve(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...rest] = line.split('=');
      const value = rest.join('=').trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = value;
      if (key === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value;
    });
  }
}

if (!supabaseUrl || !supabaseKey) {
  console.warn('[RSS] ⚠️  VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no definidas. Saltando RSS feed.');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = process.env.SITE_URL || 'https://agendaya.netlify.app';

async function generateRss() {
  console.log('[RSS] 📡 Generando RSS feed del blog...');

  const { data: posts, error } = await supabase
    .from('agendaya_blog_posts')
    .select('id, title, excerpt, content, image_url, author_name, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[RSS] ❌ Error fetching posts:', error.message);
    return;
  }

  if (!posts || posts.length === 0) {
    console.warn('[RSS] ⚠️  No se encontraron posts.');
    return;
  }

  const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${SITE_URL}/blog/${post.id}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.id}</guid>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 200)}]]></description>
      <author><![CDATA[${post.author_name}]]></author>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      ${post.image_url ? `<enclosure url="${post.image_url}" type="image/jpeg" />` : ''}
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog AgendaYa</title>
    <link>${SITE_URL}/blog</link>
    <description>Historias, consejos y novedades del ecosistema AgendaYa.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  const outputPath = resolve(__dirname, '..', 'dist', 'blog', 'rss.xml');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, rss, 'utf-8');
  console.log(`[RSS] ✅ RSS feed generado: ${outputPath} (${posts.length} artículos)`);
}

generateRss().catch(err => {
  console.error('[RSS] ❌ Error:', err);
  process.exit(1);
});
