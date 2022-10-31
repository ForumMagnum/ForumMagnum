import { darkModeTheme } from './darkMode';

export const getUserTheme = (name: UserThemeName): UserThemeSpecification => {
  switch (name) {
    case "default": return {};
    case "dark": return darkModeTheme;
  }
}
