import { forumTypeSetting } from '../lib/instanceSettings';
import getAfTheme from '../themes/alignmentForumTheme'
import getEaTheme from '../themes/eaTheme'
import getLwTheme from '../themes/lesswrongTheme'
import type { ThemeName } from '../themes/themeNames';

export const getForumTheme = (themeName: ThemeName) => {
  switch (forumTypeSetting.get()) {
    case 'AlignmentForum':
      return getAfTheme(themeName);
    case 'EAForum':
      return getEaTheme(themeName);
    default:
      return getLwTheme(themeName);
  }
}
