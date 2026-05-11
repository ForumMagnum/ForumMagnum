import { useCallback, useState } from 'react';

// Toggle state shared by all expandable rows; isolated so item components
// don't each redeclare the same useState/useCallback boilerplate.
export function useExpandable() {
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded(prev => !prev), []);
  return { expanded, toggle };
}
