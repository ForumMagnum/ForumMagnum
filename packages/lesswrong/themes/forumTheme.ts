import { forumTypeSetting } from '../lib/instanceSettings';
import getAfTheme from '../themes/alignmentForumTheme'
import getEaTheme from '../themes/eaTheme'
import getLwTheme from '../themes/lesswrongTheme'
import { getForumType, ThemeOptions } from './themeNames';

export const getForumTheme = (themeOptions: ThemeOptions) => {
  const forumTypeTheme = getForumType(themeOptions);
  
  switch (forumTypeTheme) {
    case 'AlignmentForum':
      return getAfTheme(themeOptions);
    case 'EAForum':
      return getEaTheme(themeOptions);
    default:
      return getLwTheme(themeOptions);
  }
}
