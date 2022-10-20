import { forumTypeSetting, ForumTypeString } from '../lib/instanceSettings';

export const userThemeNames = ["default", "dark"] as const;
export const userThemeSettings = [...userThemeNames, "auto"] as const;
export const muiThemeNames = ["light", "dark"] as const;

export type ThemeOptions = {
  name: UserThemeName

  // Overridden forum type (for admins to quickly test AF and EA Forum themes).
  // This is the form of a partial forum-type=>forum-type mapping, where keys
  // are the actual forum you're visiting and values are the theme you want.
  // (So if you override this on LW, then go to AF it isn't overridden there,
  // and vise versa.)
  siteThemeOverride?: Partial<Record<ForumTypeString,ForumTypeString>>
}

export type AbstractThemeOptions = Pick<ThemeOptions, "siteThemeOverride"> & {
  name: UserThemeSetting
}

export type ThemeMetadata = {
  // Name to use for this theme internally, in config settings and stylesheet
  // names and whatnot. URL-safe characters only.
  name: UserThemeSetting

  // Name to use for this theme when displaying it in menus. Title cased, with
  // spaces.
  label: string
}

export const themeMetadata: Array<ThemeMetadata> = forumTypeSetting.get() === "EAForum"
  ? [
    {
      name: "auto",
      label: "Auto",
    },
    {
      name: "default",
      label: "Light",
    },
    {
      name: "dark",
      label: "Dark",
    },
  ]
  : [
    {
      name: "default",
      label: "Default",
    },
    {
      name: "dark",
      label: "Dark Mode",
    },
  ];

export function isValidSerializedThemeOptions(options: string|object): boolean {
  try {
    if (typeof options==="object") {
      const optionsObj = (options as any)
      if (isValidUserThemeSetting(optionsObj.name))
        return true;
    } else {
      const deserialized = JSON.parse(options as string);
      if (isValidUserThemeSetting(deserialized.name))
        return true;
    }
    return false;
  } catch(e) {
    // Invalid JSON -> exception -> false
    return false;
  }
}

export const isValidUserThemeSetting = (name: string): name is UserThemeSetting =>
  userThemeSettings.includes(name as unknown as UserThemeSetting);

export function getForumType(themeOptions: AbstractThemeOptions) {
  const actualForumType = forumTypeSetting.get();
  return (themeOptions?.siteThemeOverride && themeOptions.siteThemeOverride[actualForumType]) || actualForumType;
}

export const defaultThemeOptions = {"name":"default"};

export function getThemeOptions(themeCookie: string | object, user: DbUser|UsersCurrent|null): AbstractThemeOptions {
  if (user?.theme && isValidUserThemeSetting(user?.theme)) {
    return {name: user?.theme};
  }
  const themeOptionsFromCookie = themeCookie && isValidSerializedThemeOptions(themeCookie) ? themeCookie : null;
  const themeOptionsFromUser = (user?.theme && isValidSerializedThemeOptions(user.theme)) ? user.theme : null;
  const serializedThemeOptions = themeOptionsFromCookie || themeOptionsFromUser || defaultThemeOptions;
  const themeOptions: ThemeOptions = (typeof serializedThemeOptions==="string") ? JSON.parse(serializedThemeOptions) : serializedThemeOptions;
  return themeOptions;
}
