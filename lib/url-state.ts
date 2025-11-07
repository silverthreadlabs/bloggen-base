/**
 * URL State Management
 *
 * Centralized exports for nuqs-based URL state management.
 * Import hooks and parsers from here for consistency.
 */

// Re-export nuqs core functions
export {
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from 'nuqs';
// Provider
export { URLStateProvider } from '@/components/providers/url-state-provider';
// Pre-built hooks
export {
  useChatParams,
  useOrderParam,
  usePageParam,
  usePaginationParams,
  useSearchParam,
  useSortParam,
  useTabParam,
} from './hooks/use-url-state';
// Custom parsers
export {
  parseAsBoolean,
  parseAsDate,
  parseAsDateRange,
  parseAsIntegerArray,
  parseAsJson,
  parseAsLiteral,
  parseAsStringArray,
} from './utils/url-parsers';
