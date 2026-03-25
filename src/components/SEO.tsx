import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'business.business';
  schemaData?: object;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  ogType = 'website',
  schemaData 
}) => {
  const siteName = 'AgendaYa';
  const fullTitle = title ? `${title} | ${siteName}` : `${siteName} - Agendamiento inteligente para tu negocio`;
  const defaultDescription = 'La plataforma líder para gestionar citas y reservas de forma profesional y cordial.';
  const siteUrl = window.location.origin;
  const currentUrl = canonical || window.location.href;
  const image = ogImage || `${siteUrl}/og-default.png`; // Asegúrate de tener una imagen por defecto

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <link rel="canonical" href={currentUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data (Schema.org) */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
