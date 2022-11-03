import type { Rule, Stylesheet } from 'react-jss/lib/jss';

export const generateClassName = (rule: Rule, styleSheet: Stylesheet): string => {
  const prefix = styleSheet?.options?.classNamePrefix;
  return prefix ? `${prefix}-${rule.key}` : rule.key;
};
