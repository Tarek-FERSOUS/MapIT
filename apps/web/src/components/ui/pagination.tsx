import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  const { page, totalPages } = meta;

  const pages = [];
  const maxPagesToShow = 5;

  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      {pages.map((p, i) => (
        <button
          key={i}
          onClick={() => typeof p === 'number' && onPageChange(p)}
          disabled={typeof p === 'string'}
          className={`
            px-3 py-1 rounded
            ${typeof p === 'string' 
              ? 'text-slate-500 cursor-default' 
              : p === page
              ? 'bg-primary-600 text-white'
              : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
            }
          `}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: Breadcrumb[];
  onNavigate?: (href: string) => void;
}

export function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-slate-400">/</span>}
          {item.href && onNavigate ? (
            <button
              onClick={() => onNavigate(item.href!)}
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-slate-900">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
