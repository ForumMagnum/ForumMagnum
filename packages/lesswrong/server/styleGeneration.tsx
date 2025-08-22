import React from 'react';
import sortBy from 'lodash/sortBy';
import { ThemeOptions } from '../themes/themeNames';
import { getJss, type StylesContextType } from '@/components/hooks/useStyles';
import keyBy from 'lodash/keyBy';
import type { JssStyles } from '@/lib/jssStyles';
import { SheetsRegistry } from 'jss';

export type ClassNameProxy<T extends string = string> = Record<T,string>
export type StyleDefinition<T extends string = string, N extends string = string> = {
  name: N
  styles: (theme: ThemeType) => JssStyles<T>
  options?: StyleOptions
  nameProxy: ClassNameProxy<T>|null
}
export type StyleOptions = {
  // Whether to ignore the presence of colors that don't come from the theme in
  // the component's stylesheet. Use for things that don't change color with
  // dark mode.
  allowNonThemeColors?: boolean,
  
  // Default is 0. If classes with overlapping attributes from two different
  // components' styles wind up applied to the same node, the one with higher
  // priority wins.
  stylePriority?: number,
}

function stylesToStylesheet(allStyles: Record<string,StyleDefinition>, theme: ThemeType, themeOptions: ThemeOptions): string {
  const stylesByName = sortBy(Object.keys(allStyles), n=>n);
  const stylesByNameAndPriority = sortBy(stylesByName, n=>allStyles[n].options?.stylePriority ?? 0);

  const _jss = getJss();
  const sheetsRegistry = new SheetsRegistry();
  stylesByNameAndPriority.map(name => {
    const styles = allStyles[name].styles(theme);
    const sheet = _jss.createStyleSheet(styles, {
      generateId: (rule) => {
        if (rule.type === 'keyframes') {
          return (rule as AnyBecauseHard).name;
        }
        return `${name}-${rule.key}`;
      },
    });
    sheetsRegistry.add(sheet);
  }).join("\n");
  return sheetsRegistry.toString();
}

export function generateEmailStylesheet({stylesContext, theme, themeOptions}: {
  stylesContext: StylesContextType,
  theme: ThemeType
  themeOptions: ThemeOptions
}): string {
  const mountedStyles = stylesContext.mountedStyles;
  const usedStyleDefinitions = [...mountedStyles.values()].map(s => s.styleDefinition).filter(s => !!s);
  const usedStylesByName = keyBy(usedStyleDefinitions, s=>s.name);
  return stylesToStylesheet(usedStylesByName, theme, themeOptions);
}

