import { useState, useEffect } from 'react';

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function colorDistance(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function lighten(c: { r: number; g: number; b: number }, amount: number): { r: number; g: number; b: number } {
  return {
    r: Math.round(c.r + (255 - c.r) * amount),
    g: Math.round(c.g + (255 - c.g) * amount),
    b: Math.round(c.b + (255 - c.b) * amount),
  };
}

function extractGradient(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 'linear-gradient(160deg, #f1f5f9, #e2e8f0)';

  const size = 10;
  canvas.width = size;
  canvas.height = size;

  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size).data;
  const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

  for (let i = 0; i < imageData.length; i += 4) {
    const r = Math.round(imageData[i] / 48) * 48;
    const g = Math.round(imageData[i + 1] / 48) * 48;
    const b = Math.round(imageData[i + 2] / 48) * 48;
    const key = `${r},${g},${b}`;

    if (colorBuckets[key]) {
      colorBuckets[key].count++;
    } else {
      colorBuckets[key] = { r, g, b, count: 1 };
    }
  }

  const sorted = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

  const slate = { r: 226, g: 232, b: 240, count: 1 };
  const primary = sorted[0] ? lighten(sorted[0], 0.65) : lighten(slate, 0.65);
  let secondary = sorted[1] ? lighten(sorted[1], 0.7) : lighten(slate, 0.7);
  if (sorted[1] && colorDistance(sorted[0], sorted[1]) < 50) {
    secondary = sorted.length > 2 && colorDistance(sorted[0], sorted[2]) >= 50
      ? lighten(sorted[2], 0.7)
      : lighten(slate, 0.7);
  }

  return `linear-gradient(160deg, ${rgbToHex(primary.r, primary.g, primary.b)} 0%, ${rgbToHex(secondary.r, secondary.g, secondary.b)} 100%)`;
}

const cache = new Map<string, string>();

export function useDominantColor(imageUrl: string | null | undefined): string {
  const [gradient, setGradient] = useState('linear-gradient(160deg, #f1f5f9, #e2e8f0)');

  useEffect(() => {
    if (!imageUrl) {
      setGradient('linear-gradient(160deg, #f1f5f9, #e2e8f0)');
      return;
    }

    if (cache.has(imageUrl)) {
      setGradient(cache.get(imageUrl)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const g = extractGradient(img);
      cache.set(imageUrl, g);
      setGradient(g);
    };

    img.onerror = () => {
      setGradient('linear-gradient(160deg, #f1f5f9, #e2e8f0)');
    };

    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return gradient;
}
