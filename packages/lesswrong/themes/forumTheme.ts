import createBreakpoints from "@/lib/vendor/@material-ui/core/src/styles/createBreakpoints";
import deepmerge from 'deepmerge';
import type { ForumTypeString } from '../lib/instanceSettings';
import { baseTheme } from './createThemeDefaults';
import { getSiteTheme } from './siteThemes/index';
import { getForumType, ThemeOptions } from './themeNames';
import { getUserTheme } from './userThemes/index';

const themeCache = new Map<string,ThemeType>();

// Get a theme for the given theme options.
// NOTE: Somewhere downstream, this feeds into a JSS-compilation cache. It's
// important that, given the same theme options, this always return something
// reference-equal to other versions with the same theme options, or else there
// will be a memory leak on every pageload.
export const getForumTheme = (themeOptions: ThemeOptions): ThemeType => {
  const forumType = getForumType(themeOptions);
  const themeCacheKey = `${forumType}/${themeOptions.name}`;
  
  if (!themeCache.has(themeCacheKey)) {
    const siteTheme = getSiteTheme(forumType);
    const userTheme = getUserTheme(themeOptions.name);
    const theme = buildTheme(userTheme, siteTheme, forumType, themeOptions);
    themeCache.set(themeCacheKey, theme);
  }
  
  return themeCache.get(themeCacheKey)! as any;
}

const buildTheme = (
  userTheme: UserThemeSpecification,
  siteTheme: SiteThemeSpecification,
  forumType: ForumTypeString,
  themeOptions: ThemeOptions,
): ThemeType => {
  let shadePalette: ThemeShadePalette = baseTheme.shadePalette;
  if (siteTheme.shadePalette) shadePalette = deepmerge(shadePalette, siteTheme.shadePalette);
  if (userTheme.shadePalette) shadePalette = deepmerge(shadePalette, userTheme.shadePalette);
  
  let componentPalette: ThemeComponentPalette = baseTheme.componentPalette(shadePalette);
  if (siteTheme.componentPalette) componentPalette = deepmerge(componentPalette, siteTheme.componentPalette(shadePalette));
  if (userTheme.componentPalette) componentPalette = deepmerge(componentPalette, userTheme.componentPalette(shadePalette));
  
  let palette: ThemePalette = { ...deepmerge(shadePalette, componentPalette), shadePalette };
  
  let combinedTheme = baseTheme.make(palette);
  if (siteTheme.make) combinedTheme = deepmerge(combinedTheme, siteTheme.make(palette));
  if (userTheme.make) combinedTheme = deepmerge(combinedTheme, userTheme.make(palette));
  
  return {
    forumType,
    ...combinedTheme,
    palette,
    themeOptions,
    
    breakpoints: createBreakpoints(),
  };
}

export const preferredHeadingCase = (input: string) => input;
