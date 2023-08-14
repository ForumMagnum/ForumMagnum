import { getForumType, ThemeOptions } from './themeNames';
import { baseTheme } from './createThemeDefaults';
import { createMuiTheme, Theme as MuiThemeType } from '@material-ui/core/styles';
import { getUserTheme } from './userThemes/index';
import { getSiteTheme } from './siteThemes/index';
import type { ForumTypeString } from '../lib/instanceSettings';
import deepmerge from 'deepmerge';
import { forumSelect } from '../lib/forumTypeUtils';

/**
 * Is this Forum a muted, dignified book-like experience, or a modern, friendly
 * site with more rounded corners?
 *
 * There are some decisions like "what do you call bookmarked posts" that also
 * hinge on this setting, making a bit like a, "which tribe are you" question,
 * in addition to controlling the basic UI style.
 */
export const siteUIStyle = forumSelect<"book"|"friendly">({
  LWAF: "book",
  EAForum: "friendly",
  default: "friendly",
})
export const isBookUI = siteUIStyle === "book";
export const isFriendlyUI = siteUIStyle === "friendly";

const themeCache = new Map<string,ThemeType>();

// Get a theme for the given theme options.
// NOTE: Somewhere downstream, this feeds into a JSS-compilation cache. It's
// important that, given the same theme options, this always return something
// reference-equal to other versions with the same theme options, or else there
// will be a memory leak on every pageload.
export const getForumTheme = (themeOptions: ThemeOptions): MuiThemeType&ThemeType => {
  const forumType = getForumType(themeOptions);
  const themeCacheKey = `${forumType}/${themeOptions.name}`;
  
  if (!themeCache.has(themeCacheKey)) {
    const siteTheme = getSiteTheme(forumType);
    const userTheme = getUserTheme(themeOptions.name);
    const theme = buildTheme(userTheme, siteTheme, forumType);
    themeCache.set(themeCacheKey, theme);
  }
  
  return themeCache.get(themeCacheKey)! as any;
}

const buildTheme = (
  userTheme: UserThemeSpecification,
  siteTheme: SiteThemeSpecification,
  forumType: ForumTypeString
): ThemeType => {
  let shadePalette: ThemeShadePalette = baseTheme.shadePalette;
  if (siteTheme.shadePalette) shadePalette = deepmerge(shadePalette, siteTheme.shadePalette);
  if (userTheme.shadePalette) shadePalette = deepmerge(shadePalette, userTheme.shadePalette);
  
  let componentPalette: ThemeComponentPalette = baseTheme.componentPalette(shadePalette);
  if (siteTheme.componentPalette) componentPalette = deepmerge(componentPalette, siteTheme.componentPalette(shadePalette));
  if (userTheme.componentPalette) componentPalette = deepmerge(componentPalette, userTheme.componentPalette(shadePalette));
  
  let palette: ThemePalette = deepmerge(shadePalette, componentPalette);
  
  let combinedTheme = baseTheme.make(palette);
  if (siteTheme.make) combinedTheme = deepmerge(combinedTheme, siteTheme.make(palette));
  if (userTheme.make) combinedTheme = deepmerge(combinedTheme, userTheme.make(palette));
  
  let themeWithPalette = {
    forumType,
    ...combinedTheme,
    palette
  };
  return createMuiTheme(themeWithPalette as any) as any;
}
