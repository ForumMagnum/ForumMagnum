import type { StyleDefinition } from "../server/styleGeneration";
import sortBy from "lodash/sortBy";
import { getJss } from "@/lib/jssStyles";
import { SheetsRegistry } from 'jss';
import keyBy from "lodash/keyBy";

export function stylesToStylesheet(allStyles: Record<string,StyleDefinition>, theme: ThemeType): string {
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

export function generateEmailStylesheet({ stylesUsed, theme }: {
  stylesUsed: Set<StyleDefinition>;
  theme: ThemeType;
}): string {
  const usedStyleDefinitions = [...stylesUsed];
  const usedStylesByName = keyBy(usedStyleDefinitions.filter(s => !!s), s => s.name);
  return stylesToStylesheet(usedStylesByName, theme);
}
