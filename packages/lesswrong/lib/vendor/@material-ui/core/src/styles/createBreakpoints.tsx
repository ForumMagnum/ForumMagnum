export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Sorted ASC by size. That's important.
// It can't be configured as it's used statically for propTypes.
export const keys = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

// Keep in mind that @media is inclusive by the CSS specification.
export default function createBreakpoints() {
    // The breakpoint **start** at this value.
    // For instance with the first breakpoint xs: [xs, sm[.
  const values: Record<Breakpoint,number> = {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  };
  const unit = 'px';
  const step = 5;

  function up(key: Breakpoint) {
    const value = typeof values[key] === 'number' ? values[key] : key;
    return `@media (min-width:${value}${unit})`;
  }

  function down(key: Breakpoint) {
    const endIndex = keys.indexOf(key) + 1;
    const upperbound = values[keys[endIndex]];

    if (endIndex === keys.length) {
      // xl down applies to all sizes
      return up('xs');
    }

    const value: AnyBecauseTodo = typeof upperbound === 'number' && endIndex > 0 ? upperbound : key;
    return `@media (max-width:${value - step / 100}${unit})`;
  }

  function between(start: Breakpoint, end: Breakpoint) {
    const endIndex = keys.indexOf(end) + 1;

    if (endIndex === keys.length) {
      return up(start);
    }

    return (
      `@media (min-width:${values[start]}${unit}) and ` +
      `(max-width:${values[keys[endIndex]] - step / 100}${unit})`
    );
  }

  function only(key: Breakpoint) {
    return between(key, key);
  }

  function width(key: Breakpoint) {
    return values[key];
  }

  return {
    keys,
    values,
    up,
    down,
    between,
    only,
    width,
  };
}
