import { UsersCurrent } from '@/lib/generated/gql-codegen/graphql';
import { DeferredForumSelect } from '../lib/forumTypeUtils';
import { forumTypeSetting } from '../lib/instanceSettings';
import { TupleSet } from '../lib/utils/typeGuardUtils';

export const userThemeNames = new TupleSet(["default", "dark"] as const);
export const userThemeSettings = new TupleSet([...userThemeNames, "auto"] as const);
export const muiThemeNames = new TupleSet(["light", "dark"] as const);

export type ThemeOptions = {
  name: UserThemeName,
  siteThemeOverride?: SiteThemeOverride,
}

export type AbstractThemeOptions = {
  name: UserThemeSetting,
  siteThemeOverride?: SiteThemeOverride,
}

export const themeOptionsAreConcrete = (themeOptions: AbstractThemeOptions): themeOptions is ThemeOptions =>
  userThemeNames.has(themeOptions.name);

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
    {
      name: "auto",
      label: "Auto",
    },
  ];

export function isValidSerializedThemeOptions(options: string|object): options is string | AbstractThemeOptions {
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
  userThemeSettings.has(name);

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

export const defaultThemeOptions = new DeferredForumSelect({
  EAForum: {name: "auto"},
  default: {name: "default"},
} as const);

export const getDefaultThemeOptions = (): AbstractThemeOptions =>
  defaultThemeOptions.get();

const deserializeThemeOptions = (themeOptions: object | string): AbstractThemeOptions => {
  if (typeof themeOptions === "string") {
    return isValidUserThemeSetting(themeOptions)
      ? {name: themeOptions}
      : JSON.parse(themeOptions);
  } else {
    return themeOptions as AbstractThemeOptions;
  }
}

const getSerializedThemeOptions = (
  themeCookie: string | object,
  user: DbUser|UsersCurrent | null,
): string|AbstractThemeOptions => {
  // Try to read from the cookie
  if (themeCookie && isValidSerializedThemeOptions(themeCookie)) {
    return themeCookie;
  }

  // Check if the user setting is a serialized ThemeOptions object
  if (user?.theme && isValidSerializedThemeOptions(user.theme)) {
    return user.theme;
  }

  // If we still don't have anything, use the default
  return getDefaultThemeOptions();
}

export const getThemeOptions = (
  themeCookie: string | object,
  user: DbUser|UsersCurrent | null,
): AbstractThemeOptions =>
  deserializeThemeOptions(getSerializedThemeOptions(themeCookie, user));
