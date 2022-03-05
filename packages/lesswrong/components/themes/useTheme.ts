import { getForumTheme } from '../../themes/forumTheme';

export const useTheme = (): ThemeType => {
  // TODO
  return getForumTheme({name: "default", forumThemeOverride: {}});
}
