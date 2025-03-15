import React from 'react';
import { importAllComponents, ComponentsTable } from '../lib/vulcan-lib/components';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import sortBy from 'lodash/sortBy';
import draftjsStyles from '../themes/globalStyles/draftjsStyles';
import miscStyles from '../themes/globalStyles/miscStyles';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import type { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import { minify } from 'csso';
import { requestedCssVarsToString } from '../themes/cssVars';
import stringify from 'json-stringify-deterministic';
import { brotliCompressResource, CompressedCacheResource } from './utils/bundleUtils';
import { topLevelStyleDefinitions } from '@/components/hooks/useStyles';
import keyBy from 'lodash/keyBy';
import type { JssStyles } from '@/lib/jssStyles';
import { create as jssCreate, SheetsRegistry } from 'jss';
import jssPreset from '@/lib/vendor/@material-ui/core/src/styles/jssPreset';
import pick from 'lodash/pick';

export type ClassNameProxy<T extends string = string> = Record<T,string>
export type StyleDefinition<T extends string = string> = {
  name: string
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

/**
 * Return a mapping from component-name to style definition, for components
 * that defined their styles by passing them to `registerComponent`.
 *
 * Precondition: all components (that you want to be included) have been
 * imported, eg with importAllComponents.
 */
function getComponentStyles(): Record<string,StyleDefinition> {
  // Sort components by stylePriority, tiebroken by name (alphabetical)
  return keyBy(
    Object.keys(ComponentsTable)
      .filter(componentName => !!ComponentsTable[componentName].options?.styles)
      .map(componentName => ({
        name: componentName,
        styles: ComponentsTable[componentName].options!.styles!,
        options: ComponentsTable[componentName].options,
        nameProxy: null
      })),
    c=>c.name
  );
}

function getAllStylesByName() {
  importAllComponents();
  return {
    ...getComponentStyles(),
    ...topLevelStyleDefinitions,
  };
}

function stylesToStylesheet(allStyles: Record<string,StyleDefinition>, theme: ThemeType): string {
  const stylesByName = sortBy(Object.keys(allStyles), n=>n);
  const stylesByNameAndPriority = sortBy(stylesByName, n=>allStyles[n].options?.stylePriority ?? 0);
  
  const sheetsRegistry = new SheetsRegistry();
  
  const _jss = jssCreate({
    ...jssPreset(),
    virtual: true,
  });

  stylesByNameAndPriority.map(name => {
    const styles = allStyles[name].styles(theme);
    const sheet = _jss.createStyleSheet(styles, {
      generateId: (rule) => {
        return `${name}-${rule.key}`;
      },
    });
    sheetsRegistry.add(sheet);
  }).join("\n");
  return sheetsRegistry.toString();
}

const generateMergedStylesheet = (themeOptions: ThemeOptions): Buffer => {
  const allStyles = getAllStylesByName()
  const theme = getForumTheme(themeOptions);
  const jssStylesheet = stylesToStylesheet(allStyles, theme);
  const cssVars = requestedCssVarsToString(theme);
  
  const mergedCSS = [
    draftjsStyles(),
    miscStyles(),
    jssStylesheet,
    ...theme.rawCSS,
    cssVars,
  ].join("\n");

  const minifiedCSS = minify(mergedCSS).css;
  return Buffer.from(minifiedCSS, "utf8");
}

export function generateEmailStylesheet(styleNamesUsed: string[], theme: ThemeType): string {
  const allStyles = getAllStylesByName();
  const usedStyles = pick(allStyles, styleNamesUsed);
  return stylesToStylesheet(usedStyles, theme);
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
