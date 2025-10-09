import * as React from 'react';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const Pagination = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<'nav'> & { role?: 'navigation' }
>(({ className, role = 'navigation', ...props }, ref) => (
  <nav
    role={role}
    aria-label="pagination"
    className={cn('mx-auto flex w-full justify-center', className)}
    ref={ref}
    {...props}
  />
));
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  ),
);
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn('flex h-9 w-9 items-center justify-center', className)}
      {...props}
    />
  ),
);
PaginationItem.displayName = 'PaginationItem';

const PaginationLink = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & {
    isActive?: boolean;
  }
>(({ className, isActive, disabled, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled}
    className={cn(
      'flex h-9 w-9 items-center justify-center rounded-md border border-muted-foreground/20 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      isActive && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
      className,
    )}
    {...props}
  />
));
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, ...props }, ref) => (
    <PaginationLink
      ref={ref}
      aria-label="Go to previous page"
      className={cn('h-9 min-w-9 px-2 md:min-w-[2.5rem] md:px-3', className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      <span className="sr-only">Previous</span>
    </PaginationLink>
  ),
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, ...props }, ref) => (
    <PaginationLink
      ref={ref}
      aria-label="Go to next page"
      className={cn('h-9 min-w-9 px-2 md:min-w-[2.5rem] md:px-3', className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" aria-hidden />
      <span className="sr-only">Next</span>
    </PaginationLink>
  ),
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({ className, ...props }: React.ComponentPropsWithoutRef<'span'>) => (
  <span className={cn('flex h-9 w-9 items-center justify-center text-sm font-medium text-muted-foreground', className)} {...props}>
    …
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
