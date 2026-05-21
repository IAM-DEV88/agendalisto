import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[sitemap] ⚠️ VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no definidas — generando sitemap solo con rutas estáticas');
  generateStaticOnly();
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const SITE_URL = process.env.SITE_URL || 'https://agendalisto.com';

async function generateSitemap() {
  const urls = [];

  // Rutas estáticas
  const staticRoutes = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/explore', changefreq: 'daily', priority: '0.9' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    { loc: '/login', changefreq: 'monthly', priority: '0.3' },
    { loc: '/register', changefreq: 'monthly', priority: '0.5' },
    { loc: '/forgot-password', changefreq: 'monthly', priority: '0.1' },
    { loc: '/crowdfunding', changefreq: 'weekly', priority: '0.6' },
  ];

  for (const route of staticRoutes) {
    urls.push(`  <url>
    <loc>${SITE_URL}${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`);
  }

  // Rutas dinámicas: negocios
  try {
    const { data: businesses } = await supabase
      .from('agendaya_businesses')
      .select('slug, updated_at')
      .eq('status', 'active');

    if (businesses) {
      for (const b of businesses) {
        const lastmod = b.updated_at
          ? new Date(b.updated_at).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        urls.push(`  <url>
    <loc>${SITE_URL}/${b.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
      console.log(`[sitemap] ✅ ${businesses.length} negocios añadidos`);
    }
  } catch (err) {
    console.warn('[sitemap] ⚠️ Error fetching businesses:', err.message);
  }

  // Rutas dinámicas: blog posts
  try {
    const { data: posts } = await supabase
      .from('agendaya_blog_posts')
      .select('id, updated_at, created_at')
      .eq('status', 'published');

    if (posts) {
      for (const p of posts) {
        const lastmod = p.updated_at || p.created_at;
        const date = lastmod
          ? new Date(lastmod).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        urls.push(`  <url>
    <loc>${SITE_URL}/blog/${p.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }
      console.log(`[sitemap] ✅ ${posts.length} posts añadidos`);
    }
  } catch (err) {
    console.warn('[sitemap] ⚠️ Error fetching blog posts:', err.message);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  const outPath = resolve(__dirname, '..', 'dist', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] ✅ Generado: ${outPath} (${urls.length} URLs)`);
}

function generateStaticOnly() {
  const SITE_URL = 'https://agendalisto.com';
  const urls = [
    '/', '/explore', '/blog', '/login', '/register',
    '/forgot-password', '/crowdfunding',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>\n    <loc>${SITE_URL}${u}</loc>\n  </url>`).join('\n')}
</urlset>`;

  const outPath = resolve(__dirname, '..', 'dist', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`[sitemap] ✅ Generado (estático): ${outPath} (${urls.length} URLs)`);
}

generateSitemap().catch((err) => {
  console.error('[sitemap] ❌ Error:', err.message);
  generateStaticOnly();
});
