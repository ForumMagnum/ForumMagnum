import type { ForumTypeString } from '@/lib/instanceSettings';
import type { StyleDefinition } from "@/server/styleGeneration";
import type { AbstractThemeOptions } from "@/themes/themeNames";
import { abstractThemeToConcrete, themeOptionsAreConcrete } from "@/themes/themeNames";
import { getForumTheme } from "@/themes/forumTheme";
import { styleNodeToString } from "@/lib/jssStyles";

// JSON-serialized theme => style definition => cached string. Keyed by the
// definition object rather than its name: hot reloading re-runs defineStyles,
// which creates a new definition with the same name, and a name-keyed cache
// kept serving the CSS from before the edit until the server restarted.
type StyleStringCache = Map<string, WeakMap<StyleDefinition, string>>;

function getThemeStyleCache(cache: StyleStringCache, themeKey: string): WeakMap<StyleDefinition, string> {
  const existing = cache.get(themeKey);
  if (existing) {
    return existing;
  }
  const created = new WeakMap<StyleDefinition, string>();
  cache.set(themeKey, created);
  return created;
}

const serverEmbeddedStylesCache: StyleStringCache = new Map();

export function serverEmbeddedStyles(abstractThemeOptions: AbstractThemeOptions, styleDefinitions: StyleDefinition[], forumType: ForumTypeString) {
  const themeKey = JSON.stringify([forumType, abstractThemeOptions]);
  const themeCache = getThemeStyleCache(serverEmbeddedStylesCache, themeKey);

  const result: string[] = [];
  for (const styleDefinition of styleDefinitions) {
    let styleScriptTag = themeCache.get(styleDefinition);
    if (styleScriptTag === undefined) {
      const priority = styleDefinition.options?.stylePriority ?? 0;
      const stylesStr = styleDefinitionToCSS(abstractThemeOptions, styleDefinition, forumType);
      styleScriptTag = `_embedStyles(${JSON.stringify(styleDefinition.name)},${priority},${JSON.stringify(stylesStr)})`;
      themeCache.set(styleDefinition, styleScriptTag);
    }
    result.push(styleScriptTag);
  }
  return result.join(";");
}


const serverEmbeddedStylesCSSCache: StyleStringCache = new Map();

function generateStyleDefinitionCSS(abstractThemeOptions: AbstractThemeOptions, styleDefinition: StyleDefinition, forumType: ForumTypeString): string {
  if (themeOptionsAreConcrete(abstractThemeOptions)) {
    const theme = getForumTheme(abstractThemeOptions, forumType);
    return styleNodeToString(theme, styleDefinition);
  }
  const lightThemeOptions = abstractThemeToConcrete(abstractThemeOptions, false);
  const darkThemeOptions = abstractThemeToConcrete(abstractThemeOptions, true);
  const lightTheme = getForumTheme(lightThemeOptions, forumType);
  const darkTheme = getForumTheme(darkThemeOptions, forumType);
  const lightStylesStr = styleNodeToString(lightTheme, styleDefinition);
  const darkStylesStr = styleNodeToString(darkTheme, styleDefinition);
  return (lightStylesStr === darkStylesStr)
    ? lightStylesStr
    : `@media (prefers-color-scheme: light) {\n${lightStylesStr}\n}\n@media (prefers-color-scheme: dark) {\n${darkStylesStr}\n}`;
}

export function styleDefinitionToCSS(abstractThemeOptions: AbstractThemeOptions, styleDefinition: StyleDefinition, forumType: ForumTypeString): string {
  const themeKey = JSON.stringify([forumType, abstractThemeOptions]);
  const themeCache = getThemeStyleCache(serverEmbeddedStylesCSSCache, themeKey);

  const cached = themeCache.get(styleDefinition);
  if (cached !== undefined) {
    return cached;
  }
  const stylesStr = generateStyleDefinitionCSS(abstractThemeOptions, styleDefinition, forumType);
  themeCache.set(styleDefinition, stylesStr);
  return stylesStr;
}
