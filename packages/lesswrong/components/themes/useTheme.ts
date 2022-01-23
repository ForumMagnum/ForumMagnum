import { getForumTheme } from '../../themes/forumTheme';

export const useTheme = () => {
  // TODO
  return getForumTheme({name: "default", forumThemeOverride: {}});
}
