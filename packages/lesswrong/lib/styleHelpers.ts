import type { StyleDefinition } from "../server/styleGeneration";
import sortBy from "lodash/sortBy";
import { getJss } from "@/lib/jssStyles";
import { SheetsRegistry } from 'jss';
import keyBy from "lodash/keyBy";

function stylesToStylesheet(allStyles: Record<string,StyleDefinition>, theme: ThemeType): string {
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

function replaceLightDarkWithLightModeColor(stylesheet: string): string {
  const lightDarkStart = "light-dark(";
  let css = "";
  let startIndex = 0;

  while (true) {
    const matchIndex = stylesheet.indexOf(lightDarkStart, startIndex);
    if (matchIndex === -1) {
      return css + stylesheet.slice(startIndex);
    }

    css += stylesheet.slice(startIndex, matchIndex);

    let depth = 1;
    let firstArgumentEnd = -1;
    let endIndex = matchIndex + lightDarkStart.length;

    for (; endIndex < stylesheet.length; endIndex++) {
      const character = stylesheet[endIndex];

      if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) {
          break;
        }
      } else if (character === "," && depth === 1 && firstArgumentEnd === -1) {
        firstArgumentEnd = endIndex;
      }
    }

    if (depth !== 0 || firstArgumentEnd === -1) {
      return css + stylesheet.slice(matchIndex);
    }

    css += stylesheet
      .slice(matchIndex + lightDarkStart.length, firstArgumentEnd)
      .trim();
    startIndex = endIndex + 1;
  }
}

export function generateEmailStylesheet({ stylesUsed, theme }: {
  stylesUsed: Set<StyleDefinition>;
  theme: ThemeType;
}): string {
  const usedStyleDefinitions = [...stylesUsed];
  const usedStylesByName = keyBy(usedStyleDefinitions.filter(s => !!s), s => s.name);
  return replaceLightDarkWithLightModeColor(stylesToStylesheet(usedStylesByName, theme));
}
