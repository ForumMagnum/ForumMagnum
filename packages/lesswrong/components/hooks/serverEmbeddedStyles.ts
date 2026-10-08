import type { ForumTypeString } from '@/lib/instanceSettings';
import type { StyleDefinition } from "@/server/styleGeneration";
import type { AbstractThemeOptions } from "@/themes/themeNames";
import { abstractThemeToConcrete, themeOptionsAreConcrete } from "@/themes/themeNames";
import { getForumTheme } from "@/themes/forumTheme";
import { styleNodeToString } from "@/lib/jssStyles";

// JSON-serialized theme => style name => style script tag
const serverEmbeddedStylesCache: Record<string, Record<string,string>> = {};

export function serverEmbeddedStyles(abstractThemeOptions: AbstractThemeOptions, styleDefinitions: StyleDefinition[], forumType: ForumTypeString) {
  const themeKey = JSON.stringify([forumType, abstractThemeOptions]);

  if (!serverEmbeddedStylesCache[themeKey]) {
    serverEmbeddedStylesCache[themeKey] = {};
  }
  
  const result: string[] = [];
  for (const styleDefinition of styleDefinitions) {
    const styleName = styleDefinition.name;
    if (!serverEmbeddedStylesCache[themeKey][styleName]) {
      const priority = styleDefinition.options?.stylePriority ?? 0;
      const stylesStr = styleDefinitionToCSS(abstractThemeOptions, styleDefinition, forumType);
      const styleScriptTag = `_embedStyles(${JSON.stringify(styleDefinition.name)},${priority},${JSON.stringify(stylesStr)})`;
      serverEmbeddedStylesCache[themeKey][styleName] = styleScriptTag;
    }
    result.push(serverEmbeddedStylesCache[themeKey][styleName]);
  }
  return result.join(";");
}


// JSON-serialized theme => style name => CSS
const serverEmbeddedStylesCSSCache: Record<string, Record<string,string>> = {};

export function styleDefinitionToCSS(abstractThemeOptions: AbstractThemeOptions, styleDefinition: StyleDefinition, forumType: ForumTypeString): string {
  const themeKey = JSON.stringify([forumType, abstractThemeOptions]);

  if (!serverEmbeddedStylesCSSCache[themeKey]) {
    serverEmbeddedStylesCSSCache[themeKey] = {};
  }
  
  const styleName = styleDefinition.name;
  if (!serverEmbeddedStylesCSSCache[themeKey][styleName]) {
    const priority = styleDefinition.options?.stylePriority ?? 0;

    if (themeOptionsAreConcrete(abstractThemeOptions)) {
      const theme = getForumTheme(abstractThemeOptions, forumType);
      const stylesStr = styleNodeToString(theme, styleDefinition);
      serverEmbeddedStylesCSSCache[themeKey][styleName] = stylesStr;
    } else {
      const lightThemeOptions = abstractThemeToConcrete(abstractThemeOptions, false);
      const darkThemeOptions = abstractThemeToConcrete(abstractThemeOptions, true);
      const lightTheme = getForumTheme(lightThemeOptions, forumType);
      const darkTheme = getForumTheme(darkThemeOptions, forumType);
      const lightStylesStr = styleNodeToString(lightTheme, styleDefinition);
      const darkStylesStr = styleNodeToString(darkTheme, styleDefinition);
      const stylesStr = (lightStylesStr === darkStylesStr)
        ? lightStylesStr
        : `@media (prefers-color-scheme: light) {\n${lightStylesStr}\n}\n@media (prefers-color-scheme: dark) {\n${darkStylesStr}\n}`
      serverEmbeddedStylesCSSCache[themeKey][styleName] = stylesStr;
    }
  }
  return serverEmbeddedStylesCSSCache[themeKey][styleName];
}
