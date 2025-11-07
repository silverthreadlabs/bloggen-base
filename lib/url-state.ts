/**
 * URL State Management
 * 
 * Centralized exports for nuqs-based URL state management.
 * Import hooks and parsers from here for consistency.
 */

// Re-export nuqs core functions
export { useQueryState, useQueryStates, parseAsInteger, parseAsString } from 'nuqs';

// Pre-built hooks
export {
  useSearchParam,
  usePageParam,
  useSortParam,
  useOrderParam,
  useTabParam,
  usePaginationParams,
  useChatParams,
} from './hooks/use-url-state';

// Custom parsers
export {
  parseAsBoolean,
  parseAsStringArray,
  parseAsIntegerArray,
  parseAsJson,
  parseAsDate,
  parseAsLiteral,
  parseAsDateRange,
} from './utils/url-parsers';

// Provider
export { URLStateProvider } from '@/components/providers/url-state-provider';
