import { darkModeTheme } from './darkMode';
import { ghiblifyTheme } from './ghiblify';
import { pixelyTheme } from './pixely';

export const getUserTheme = (name: UserThemeName): UserThemeSpecification => {
  switch (name) {
    case "default": return {};
    case "dark": return darkModeTheme;
    case "ghiblify": return ghiblifyTheme;
    case "pixely": return pixelyTheme;
  }
}
