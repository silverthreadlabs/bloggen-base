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

import {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
import { DEFAULT_LENGTH, DEFAULT_TONE } from '@/lib/config/message-modifiers';
import { parseAsLiteral } from '@/lib/utils/url-parsers';

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

/**
 * Combined chat message modifiers (tone and length)
 * Usage: ?tone=professional&length=comprehensive
 */
export function useMessageModifiers() {
  return useQueryStates(
    {
      tone: parseAsLiteral([
        'neutral',
        'professional',
        'casual',
        'friendly',
        'concise',
      ] as const).withDefault(DEFAULT_TONE),
      length: parseAsLiteral([
        'auto',
        'brief',
        'balanced',
        'detailed',
        'comprehensive',
      ] as const).withDefault(DEFAULT_LENGTH),
    },
    {
      shallow: true,
    },
  );
}
