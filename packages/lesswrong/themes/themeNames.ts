import { forumTypeSetting, ForumTypeString } from '../lib/instanceSettings';

export type UserThemeName = "default"|"dark"

export type ThemeOptions = {
  name: UserThemeName
  
  // Overridden forum type (for admins to quickly test AF and EA Forum themes).
  // This is the form of a partial forum-type=>forum-type mapping, where keys
  // are the actual forum you're visiting and values are the theme you want.
  // (So if you override this on LW, then go to AF it isn't overridden there,
  // and vise versa.)
  siteThemeOverride: Partial<Record<ForumTypeString,ForumTypeString>>
}

export type ThemeMetadata = {
  // Name to use for this theme internally, in config settings and stylesheet
  // names and whatnot. URL-safe characters only.
  name: UserThemeName
  
  // Name to use for this theme when displaying it in menus. Title cased, with
  // spaces.
  label: string
}

export const themeMetadata: Array<ThemeMetadata> = [
  {
    name: "default",
    label: "Default"
  },
  {
    name: "dark",
    label: "Dark Mode"
  },
]

export function isValidSerializedThemeOptions(options: string): boolean {
  try {
    const deserialized = JSON.parse(options);
    if (!isValidThemeName(deserialized.name))
      return false;
    return true;
  } catch(e) {
    return false;
  }
}

export function isValidThemeName(name: string): name is UserThemeName {
  for (let theme of themeMetadata) {
    if (theme.name === name)
      return true;
  }
  return false;
}

export function getForumType(themeOptions: ThemeOptions) {
  const actualForumType = forumTypeSetting.get();
  return (themeOptions?.siteThemeOverride && themeOptions.siteThemeOverride[actualForumType]) || actualForumType;
}

