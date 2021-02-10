import { forumTypeSetting, ForumTypeString } from '../lib/instanceSettings';

export type ThemeName = "default"|"dark"

export type ThemeOptions = {
  name: ThemeName
  
  // Overridden forum type (for admins to quickly test AF and EA Forum themes).
  // This is the form of a partial forum-type=>forum-type mapping, where keys
  // are the actual forum you're visiting and values are the theme you want.
  // (So if you override this on LW, then go to AF it isn't overridden there,
  // and vise versa.)
  forumThemeOverride: Partial<Record<ForumTypeString,ForumTypeString>>
}

export type ThemeMetadata = {
  name: ThemeName
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

export function isValidThemeName(name: string): name is ThemeName {
  for (let theme of themeMetadata) {
    if (theme.name === name)
      return true;
  }
  return false;
}

export function getForumType(themeOptions: ThemeOptions) {
  const actualForumType = forumTypeSetting.get();
  return (themeOptions?.forumThemeOverride && themeOptions.forumThemeOverride[actualForumType]) || actualForumType;
}

