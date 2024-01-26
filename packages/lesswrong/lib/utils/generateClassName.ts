import type { Rule, Stylesheet } from 'react-jss/lib/jss';

export const generateClassName = (rule: typeof Rule, styleSheet: typeof Stylesheet): string => {
  const prefix = styleSheet?.options?.classNamePrefix;
  return prefix ? `${prefix}-${rule.key}` : rule.key;
};
