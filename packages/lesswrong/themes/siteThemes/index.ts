import { ForumTypeString } from '../../lib/instanceSettings';
import { alignmentForumTheme } from './alignmentForumTheme'
import { eaForumTheme } from './eaTheme'
import { lessWrongTheme } from './lesswrongTheme'
import { wakingUpTheme } from './wakingUpTheme'

export const getSiteTheme = (forumType: ForumTypeString): SiteThemeSpecification => {
  const forumThemes: Record<ForumTypeString, SiteThemeSpecification> = {
    AlignmentForum: alignmentForumTheme,
    EAForum: eaForumTheme,
    LessWrong: lessWrongTheme,
    WakingUp: wakingUpTheme,
  }
  if (!forumThemes[forumType]) throw Error(`No theme for forum type ${forumType}`);

  return forumThemes[forumType];
}
