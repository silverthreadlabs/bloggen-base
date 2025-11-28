/**
 * URL State Management Hooks using nuqs
 *
 * Basic setup for URL state management with scalability in mind.
 * Provides type-safe hooks for managing state in URL search params.
 *
 * @example
 * ```tsx
 * // In a client component
 * const [search, setSearch] = useSearchParam();
 * const [page, setPage] = usePageParam();
 * ```
 */

import { useState } from 'react';
import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';


/**
 * Search query parameter
 * Usage: ?search=query
 */
export function useSearchParam(defaultValue = '') {
  return useQueryState(
    'search',
    parseAsString.withDefault(defaultValue).withOptions({ shallow: true }),
  );
}

/**
 * Page number parameter
 * Usage: ?page=1
 */
export function usePageParam(defaultValue = 1) {
  return useQueryState(
    'page',
    parseAsInteger.withDefault(defaultValue).withOptions({ shallow: true }),
  );
}

/**
 * Sort parameter
 * Usage: ?sort=createdAt
 */
export function useSortParam(defaultValue = '') {
  return useQueryState(
    'sort',
    parseAsString.withDefault(defaultValue).withOptions({ shallow: true }),
  );
}

/**
 * Order parameter (asc/desc)
 * Usage: ?order=desc
 */
export function useOrderParam(defaultValue: 'asc' | 'desc' = 'desc') {
  return useQueryState(
    'order',
    parseAsString.withDefault(defaultValue).withOptions({ shallow: true }),
  );
}

/**
 * Tab parameter
 * Usage: ?tab=overview
 */
export function useTabParam(defaultValue = '') {
  return useQueryState(
    'tab',
    parseAsString.withDefault(defaultValue).withOptions({ shallow: true }),
  );
}

/**
 * Multiple parameters at once
 * Usage: Combine multiple URL params with type safety
 *
 * @example
 * ```tsx
 * const [params, setParams] = usePaginationParams();
 * // params: { page: number, search: string }
 * setParams({ page: 2, search: 'query' });
 * ```
 */
export function usePaginationParams() {
  return useQueryStates(
    {
      page: parseAsInteger.withDefault(1),
      search: parseAsString.withDefault(''),
    },
    {
      shallow: true,
    },
  );
}

/**
 * Chat-specific parameters
 * Usage: For chat filtering and navigation
 */
export function useChatParams() {
  return useQueryStates(
    {
      search: parseAsString.withDefault(''),
      filter: parseAsString.withDefault('all'), // all, pinned, archived
    },
    {
      shallow: true,
    },
  );
}


