import { forumTypeSetting } from '../lib/instanceSettings';

export const userThemeNames = ["default", "dark"] as const;
export const userThemeSettings = [...userThemeNames, "auto"] as const;
export const muiThemeNames = ["light", "dark"] as const;

export type ThemeOptions = {
  name: UserThemeName,
  siteThemeOverride?: SiteThemeOverride,
}

export type AbstractThemeOptions = {
  name: UserThemeSetting,
  siteThemeOverride?: SiteThemeOverride,
}

export const themeOptionsAreConcrete = (themeOptions: AbstractThemeOptions): themeOptions is ThemeOptions =>
  userThemeNames.includes(themeOptions.name as UserThemeName);

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

export const resolveThemeName = (
  theme: UserThemeSetting,
  prefersDarkMode: boolean,
): UserThemeName =>  theme === "auto"
  ? (prefersDarkMode ? "dark" : "default")
  : theme;

export const abstractThemeToConcrete = (
  theme: AbstractThemeOptions,
  prefersDarkMode: boolean,
): ThemeOptions => themeOptionsAreConcrete(theme)
  ? theme
  : {...theme, name: prefersDarkMode ? "dark" : "default"};

export function getForumType(themeOptions: AbstractThemeOptions) {
  const actualForumType = forumTypeSetting.get();
  return (themeOptions?.siteThemeOverride && themeOptions.siteThemeOverride[actualForumType]) || actualForumType;
}

export const defaultThemeOptions = {name: forumTypeSetting.get() === "EAForum" ? "auto" : "default"};

const deserializeThemeOptions = (themeOptions: object | string): AbstractThemeOptions => {
  if (typeof themeOptions === "string") {
    return isValidUserThemeSetting(themeOptions)
      ? {name: themeOptions}
      : JSON.parse(themeOptions);
  } else {
    return themeOptions as AbstractThemeOptions;
  }
}

export function getThemeOptions(themeCookie: string | object, user: DbUser|UsersCurrent|null): AbstractThemeOptions {
  // First, check if the user setting is a user string
  if (user?.theme && isValidUserThemeSetting(user?.theme)) {
    return {name: user?.theme};
  }

  // Next, try to read from the cookie
  const themeOptionsFromCookie = themeCookie && isValidSerializedThemeOptions(themeCookie) ? themeCookie : null;

  // Next, check if the user setting is a serialized ThemeOptions object
  const themeOptionsFromUser = (user?.theme && isValidSerializedThemeOptions(user.theme)) ? user.theme : null;

  // If we still don't have anything, use the default
  const serializedThemeOptions = themeOptionsFromCookie || themeOptionsFromUser || defaultThemeOptions;
  return deserializeThemeOptions(serializedThemeOptions);
}
