import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  if (crumbs.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${window.location.origin}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500 mb-4">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors" aria-label="Inicio">
          <Home className="w-3.5 h-3.5" />
        </Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            {c.href && i < crumbs.length - 1 ? (
              <Link to={c.href} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate max-w-[200px]">
                {c.label}
              </Link>
            ) : (
              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
