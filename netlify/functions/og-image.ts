/**
 * og-image.ts — Genera imágenes OG dinámicas para negocios y blog posts
 *
 * Uso:
 *   /og/business?name=Mi+Negocio&rating=4.5&category=Barbería&logo=https://...
 *   /og/post?title=Mi+Artículo&author=Carlos&date=2024-01-01
 *
 * Retorna un SVG de 1200×630px en línea (soportado por Google, Twitter, Facebook, WhatsApp).
 */

import { Handler, HandlerEvent } from '@netlify/functions';

const SITE_NAME = 'AgendaYa';
const SITE_COLOR = '#7C3AED'; // primary-600

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function businessSvg(params: URLSearchParams): string {
  const name = escapeXml(params.get('name') || 'Negocio');
  const rating = parseFloat(params.get('rating') || '0');
  const category = escapeXml(params.get('category') || '');
  const logoUrl = params.get('logo') ? escapeXml(params.get('logo')!) : '';
  const slug = escapeXml(params.get('slug') || '');

  const stars = rating > 0
    ? Array.from({ length: 5 }, (_, i) =>
        `<text x="${710 + i * 32}" y="380" font-size="24" fill="${i < Math.round(rating) ? '#F59E0B' : '#CBD5E1'}">★</text>`
      ).join('')
    : '';

  const ratingText = rating > 0
    ? `<text x="710" y="420" font-size="18" fill="#94A3B8" font-family="system-ui, sans-serif">${rating.toFixed(1)} · Por los clientes</text>`
    : '';

  const logoSection = logoUrl
    ? `<image href="${logoUrl}" x="80" y="140" width="120" height="120" rx="24" clip-path="inset(0 round 24px)" />`
    : `<rect x="80" y="140" width="120" height="120" rx="24" fill="rgba(255,255,255,0.15)" />
       <text x="140" y="218" font-size="48" fill="white" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700">${name.charAt(0)}</text>`;

  const categoryBadge = category
    ? `<rect x="80" y="285" width="${category.length * 10 + 20}" height="28" rx="14" fill="rgba(255,255,255,0.15)" />
       <text x="90" y="303" font-size="14" fill="rgba(255,255,255,0.8)" font-family="system-ui, sans-serif" font-weight="600">${category}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7C3AED"/>
        <stop offset="100%" style="stop-color:#4F46E5"/>
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:rgba(255,255,255,0.15)"/>
        <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>
    <rect width="1200" height="630" fill="url(#accent)"/>

    <!-- Brand -->
    <rect x="1050" y="30" width="120" height="36" rx="18" fill="rgba(255,255,255,0.12)"/>
    <text x="1110" y="53" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700">${SITE_NAME}</text>

    <!-- Logo/Initial -->
    ${logoSection}
    ${categoryBadge}

    <!-- Business Name -->
    <text x="80" y="370" font-size="${name.length > 25 ? '36' : '42'}" fill="white" font-family="system-ui, sans-serif" font-weight="800">${name}</text>

    <!-- Rating -->
    ${stars}
    ${ratingText}

    <!-- Slug / URL -->
    <text x="80" y="550" font-size="16" fill="rgba(255,255,255,0.5)" font-family="system-ui, sans-serif">${escapeXml(slug || SITE_NAME)}</text>

    <!-- Decorative circles -->
    <circle cx="1150" cy="580" r="120" fill="rgba(255,255,255,0.03)"/>
    <circle cx="1100" cy="540" r="60" fill="rgba(255,255,255,0.04)"/>
  </svg>`;
}

function postSvg(params: URLSearchParams): string {
  const title = escapeXml(params.get('title') || 'Artículo');
  const author = escapeXml(params.get('author') || '');
  const date = escapeXml(params.get('date') || '');
  const imageUrl = params.get('image') ? escapeXml(params.get('image')!) : '';
  const excerpt = escapeXml(params.get('excerpt') || '');

  const imageSection = imageUrl
    ? `<image href="${imageUrl}" x="80" y="140" width="360" height="240" rx="24" clip-path="inset(0 round 24px)" />`
    : `<rect x="80" y="140" width="360" height="240" rx="24" fill="rgba(255,255,255,0.08)" />
       <text x="260" y="270" font-size="40" fill="rgba(255,255,255,0.2)" text-anchor="middle" font-family="system-ui, sans-serif">📝</text>`;

  const metaParts: string[] = [];
  if (author) metaParts.push(author);
  if (date) metaParts.push(date);
  const metaLine = metaParts.join(' · ');

  const truncatedTitle = title.length > 60 ? title.substring(0, 60) + '…' : title;
  const truncatedExcerpt = excerpt.length > 120 ? excerpt.substring(0, 120) + '…' : excerpt;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#7C3AED"/>
        <stop offset="100%" style="stop-color:#4F46E5"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#bg)"/>

    <!-- Brand -->
    <rect x="1050" y="30" width="120" height="36" rx="18" fill="rgba(255,255,255,0.12)"/>
    <text x="1110" y="53" font-size="14" fill="rgba(255,255,255,0.7)" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="700">${SITE_NAME}</text>

    <!-- Image -->
    ${imageSection}

    <!-- Meta -->
    <text x="80" y="430" font-size="16" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif">${metaLine}</text>

    <!-- Title -->
    <text x="80" y="480" font-size="${truncatedTitle.length > 40 ? '32' : '38'}" fill="white" font-family="system-ui, sans-serif" font-weight="800">${truncatedTitle}</text>

    ${truncatedExcerpt ? `<text x="80" y="540" font-size="16" fill="rgba(255,255,255,0.6)" font-family="system-ui, sans-serif">${truncatedExcerpt}</text>` : ''}

    <!-- Footer -->
    <text x="80" y="590" font-size="14" fill="rgba(255,255,255,0.4)" font-family="system-ui, sans-serif">${SITE_NAME} — Blog de comunidad</text>

    <circle cx="1150" cy="580" r="120" fill="rgba(255,255,255,0.03)"/>
  </svg>`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const path = event.path.replace('/og-image', '').replace('/.netlify/functions/og-image', '');
  const params = new URLSearchParams(event.queryStringParameters || {});

  let svg: string;
  const cacheMaxAge = 60 * 60 * 24; // 24 horas

  if (path.startsWith('/business') || event.rawUrl?.includes('type=business')) {
    svg = businessSvg(params);
  } else if (path.startsWith('/post') || event.rawUrl?.includes('type=post')) {
    svg = postSvg(params);
  } else if (params.get('type') === 'business') {
    svg = businessSvg(params);
  } else if (params.get('type') === 'post') {
    svg = postSvg(params);
  } else {
    // Default: business card
    svg = businessSvg(params);
  }

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': `public, max-age=${cacheMaxAge}, s-maxage=${cacheMaxAge}`,
      'Access-Control-Allow-Origin': '*',
    },
    body: svg,
  };
};
