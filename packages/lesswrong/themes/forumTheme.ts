import { getForumType, ThemeOptions } from './themeNames';
import { baseTheme } from './createThemeDefaults';
import { getUserTheme } from './userThemes/index';
import { getSiteTheme } from './siteThemes/index';
import type { ForumTypeString } from '../lib/instanceSettings';
import deepmerge from 'deepmerge';
import { forumSelect } from '../lib/forumTypeUtils';
import createBreakpoints from "@/lib/vendor/@material-ui/core/src/styles/createBreakpoints";

export type SiteUIStyle = "book" | "friendly";

/**
 * Is this Forum a muted, dignified book-like experience, or a modern, friendly
 * site with more rounded corners?
 *
 * There are some decisions like "what do you call bookmarked posts" that also
 * hinge on this setting, making a bit like a, "which tribe are you" question,
 * in addition to controlling the basic UI style.
 */
const getSiteUIStyle = (): SiteUIStyle => forumSelect<SiteUIStyle>({
  LWAF: "book",
  EAForum: "friendly",
  default: "friendly",
})
export const isBookUI = () => getSiteUIStyle() === "book";
export const isFriendlyUI = () => getSiteUIStyle() === "friendly";

type StyleOptions<T> = (Record<SiteUIStyle, T> & Partial<Record<"default", T>>) | (Partial<Record<SiteUIStyle, T>> & Record<"default", T>);

export function styleSelect<T>(styleOptions: StyleOptions<T>, uiStyle?: SiteUIStyle): T {
  uiStyle ??= getSiteUIStyle();

  const value = styleOptions[uiStyle];
  if (value) return value;

  const defaultVal = styleOptions.default;
  if (defaultVal !== undefined) return defaultVal;

  throw new Error("No valid style option found and no default provided.");
}

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
  const dark = userTheme.dark ?? false;

  let componentPalette: ThemeComponentPalette = baseTheme.componentPalette(dark);
  if (siteTheme.componentPalette) componentPalette = deepmerge(componentPalette, siteTheme.componentPalette(dark));
  if (userTheme.componentPalette) componentPalette = deepmerge(componentPalette, userTheme.componentPalette(dark));

  const palette: ThemePalette = componentPalette;
  
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
