import type { ThemeOptions } from "@/themes/themeNames";
import type { StyleDefinition } from "./styleGeneration";
import sortBy from "lodash/sortBy";
import { type StylesContextType } from "@/components/hooks/useStyles";
import { getJss } from "@/lib/jssStyles";
import { SheetsRegistry } from 'jss';
import { keyBy } from "lodash";

export function stylesToStylesheet(allStyles: Record<string,StyleDefinition>, theme: ThemeType, themeOptions: ThemeOptions): string {
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

export function generateEmailStylesheet({ stylesContext, theme, themeOptions }: {
  stylesContext: StylesContextType;
  theme: ThemeType;
  themeOptions: ThemeOptions;
}): string {
  const mountedStyles = stylesContext.mountedStyles;
  const usedStyleDefinitions = [...mountedStyles.values()].map(s => s.styleDefinition);
  const usedStylesByName = keyBy(usedStyleDefinitions, s => s.name);
  return stylesToStylesheet(usedStylesByName, theme, themeOptions);
}
