import React from 'react';
import { isValidSerializedThemeOptions, ThemeOptions, getForumType } from '../themes/themeNames';
import { addStaticRoute } from './vulcan-lib/staticRoutes';
import sortBy from 'lodash/sortBy';
import type { ForumTypeString } from '../lib/instanceSettings';
import { getForumTheme } from '../themes/forumTheme';
import stringify from 'json-stringify-deterministic';
import { brotliCompressResource, CompressedCacheResource } from './utils/bundleUtils';
import { topLevelStyleDefinitions } from '@/components/hooks/useStyles';
import type { JssStyles } from '@/lib/jssStyles';
import { stylesToStylesheet } from '../lib/styleHelpers';
import { SheetsRegistry } from 'jss';
import { maybeMinifyCSS } from './maybeMinifyCSS';

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
  const jssStylesheet = stylesToStylesheet(allStyles, theme);
  
  const mergedCSS = [
    jssStylesheet,
    ...theme.rawCSS,
  ].join("\n");

  const minifiedCSS = maybeMinifyCSS(mergedCSS);
  return Buffer.from(minifiedCSS, "utf8");
}

function getAllStylesByName() {
  require("@/lib/generated/allComponents");
  require("@/lib/generated/nonRegisteredComponents");
  
  return {
    ...topLevelStyleDefinitions,
  };
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
