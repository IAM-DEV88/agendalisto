import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={clsx('bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-slate-200 dark:bg-slate-700" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  );
}

export function ServiceFormSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pb-20">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-24 h-5" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-12 w-3/4 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
