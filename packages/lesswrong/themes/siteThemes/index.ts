import { ForumTypeString } from '../../lib/instanceSettings';
import { alignmentForumTheme } from './alignmentForumTheme'
import { lessWrongTheme } from './lesswrongTheme'

export const getSiteTheme = (forumType: ForumTypeString): SiteThemeSpecification => {
  const forumThemes: Record<ForumTypeString, SiteThemeSpecification> = {
    AlignmentForum: alignmentForumTheme,
    LessWrong: lessWrongTheme,
  }
  if (!forumThemes[forumType]) throw Error(`No theme for forum type ${forumType}`);

  return forumThemes[forumType];
}
