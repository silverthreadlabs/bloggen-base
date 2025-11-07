/**
 * Custom URL parameter parsers and serializers for nuqs
 *
 * Extend nuqs with custom types and complex state serialization.
 * All parsers are type-safe and include validation.
 *
 * @see https://nuqs.47ng.com/docs/parsers
 */

import { createParser } from 'nuqs';

/**
 * Parse boolean values from URL
 * Accepts: 'true', '1', 'yes' as true
 * Everything else is false
 */
export const parseAsBoolean = createParser({
  parse: (value) => {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  },
  serialize: (value) => (value ? 'true' : 'false'),
});

/**
 * Parse array of strings from URL
 * Format: ?tags=tag1,tag2,tag3
 */
export const parseAsStringArray = createParser({
  parse: (value) => {
    if (!value) return [];
    return value.split(',').filter(Boolean);
  },
  serialize: (value) => value.join(','),
});

/**
 * Parse array of integers from URL
 * Format: ?ids=1,2,3
 */
export const parseAsIntegerArray = createParser({
  parse: (value) => {
    if (!value) return [];
    return value
      .split(',')
      .map(Number)
      .filter((n) => !Number.isNaN(n));
  },
  serialize: (value) => value.join(','),
});

/**
 * Parse JSON object from URL (for complex state)
 * Use sparingly - prefer multiple simple params
 *
 * @example
 * const [filters, setFilters] = useQueryState('filters', parseAsJson);
 */
export const parseAsJson = createParser({
  parse: (value) => {
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      return null;
    }
  },
  serialize: (value) => encodeURIComponent(JSON.stringify(value)),
});

/**
 * Parse date from URL
 * Format: ISO 8601 date string
 */
export const parseAsDate = createParser({
  parse: (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  },
  serialize: (value) => value.toISOString(),
});

/**
 * Parse literal union types (enums)
 *
 * @example
 * const viewParser = parseAsLiteral(['grid', 'list'] as const);
 * const [view, setView] = useQueryState('view', viewParser.withDefault('grid'));
 */
export function parseAsLiteral<T extends readonly string[]>(values: T) {
  return createParser({
    parse: (value): T[number] | null => {
      return values.includes(value) ? (value as T[number]) : null;
    },
    serialize: (value) => value,
  });
}

/**
 * Parse date range from URL
 * Format: ?dateRange=2024-01-01,2024-12-31
 */
export const parseAsDateRange = createParser({
  parse: (value) => {
    const [start, end] = value.split(',');
    if (!start || !end) return null;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }

    return { start: startDate, end: endDate };
  },
  serialize: (value) =>
    `${value.start.toISOString()},${value.end.toISOString()}`,
});
