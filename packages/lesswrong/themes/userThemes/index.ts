import { darkModeTheme } from './darkMode';
import { ghiblifyTheme } from './ghiblify';

export const getUserTheme = (name: UserThemeName): UserThemeSpecification => {
  switch (name) {
    case "default": return {};
    case "dark": return darkModeTheme;
    case "ghiblify": return ghiblifyTheme;
  }
}
