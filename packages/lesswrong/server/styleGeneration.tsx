import React from 'react';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import sortBy from 'lodash/sortBy';
import miscStyles from '../themes/globalStyles/miscStyles';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import type { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import { minify } from 'csso';
import { requestedCssVarsToString } from '../themes/cssVars';
import stringify from 'json-stringify-deterministic';
import { brotliCompressResource, CompressedCacheResource } from './utils/bundleUtils';
import { getJss, type StylesContextType, topLevelStyleDefinitions } from '@/components/hooks/useStyles';
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

const generateMergedStylesheet = (themeOptions: ThemeOptions): Buffer => {
  const allStyles = getAllStylesByName();
  
  const theme = getForumTheme(themeOptions);
  const cssVars = requestedCssVarsToString(theme);
  const jssStylesheet = stylesToStylesheet(allStyles, theme, themeOptions);
  
  const mergedCSS = [
    miscStyles(),
    jssStylesheet,
    ...theme.rawCSS,
    cssVars,
  ].join("\n");

  const minifiedCSS = minify(mergedCSS).css;
  return Buffer.from(minifiedCSS, "utf8");
}

function getAllStylesByName() {
  require("@/lib/generated/allComponents");
  require("@/lib/generated/nonRegisteredComponents");
  
  return {
    ...topLevelStyleDefinitions,
  };
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

type StylesheetAndHash = {
  resource: CompressedCacheResource,
  url: string,
}

const generateMergedStylesheetAndHash = (theme: ThemeOptions): StylesheetAndHash => {
  const stylesheet = generateMergedStylesheet(theme);
  const resource = brotliCompressResource(stylesheet);
  const url = `/allStyles?hash=${resource.hash}&theme=${encodeURIComponent(stringify(theme))}`;
  return { resource, url };
}

// Serialized ThemeOptions (string) -> StylesheetAndHash
const mergedStylesheets: Partial<Record<string, StylesheetAndHash>> = {};

type ThemeKey = {
  name: UserThemeName,
  forumTheme: ForumTypeString,
}

export const getMergedStylesheet = (theme: ThemeOptions): StylesheetAndHash => {
  const themeKeyData: ThemeKey = {
    name: theme.name,
    forumTheme: getForumType(theme),
  };
  const themeKey = stringify(themeKeyData);
  
  if (!mergedStylesheets[themeKey]) {
    mergedStylesheets[themeKey] = generateMergedStylesheetAndHash(theme);
  }
  const mergedStylesheet = mergedStylesheets[themeKey]!;
  
  return mergedStylesheet;
}

export function generateEmailStylesheet({stylesContext, theme, themeOptions}: {
  stylesContext: StylesContextType,
  theme: ThemeType
  themeOptions: ThemeOptions
}): string {
  const mountedStyles = stylesContext.mountedStyles;
  const usedStyleDefinitions = [...mountedStyles.values()].map(s => s.styleDefinition)
  const usedStylesByName = keyBy(usedStyleDefinitions, s=>s.name);
  return stylesToStylesheet(usedStylesByName, theme, themeOptions);
}

addStaticRoute("/allStyles", async ({query}, req, res, next) => {
  const expectedHash = query?.hash;
  const encodedThemeOptions = query?.theme;
  const serializedThemeOptions = decodeURIComponent(encodedThemeOptions);
  const validThemeOptions = isValidSerializedThemeOptions(serializedThemeOptions) ? JSON.parse(serializedThemeOptions) : {name:"default"}
  const mergedStylesheet = getMergedStylesheet(validThemeOptions);
  const stylesheetHash = mergedStylesheet.resource.hash;
  
  if (!expectedHash) {
    res.writeHead(302, {
      'Location': `/allStyles?theme=${encodedThemeOptions}&hash=${stylesheetHash}`
    })
    res.end('')
  } else if (expectedHash === stylesheetHash) {
    let headers: Record<string,string> = {
      "Cache-Control": expectedHash ? "public, max-age=604800, immutable" : "public, max-age=604800",
      "Content-Type": "text/css; charset=utf-8"
    };
    const canSendBrotli = mergedStylesheet.resource.brotli
      && req.headers['accept-encoding']
      && req.headers['accept-encoding'].includes('br');

    if (canSendBrotli) {
      headers["Content-Encoding"] = "br";
      res.writeHead(200, headers);
      res.end(mergedStylesheet.resource.brotli);
    } else {
      res.writeHead(200, headers);
      res.end(mergedStylesheet.resource.content);
    }
  } else {
    res.writeHead(404);
    res.end("");
  }
});
