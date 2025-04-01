import { ForumTypeString } from '../../lib/instanceSettings';
import { pixelyTheme } from '../userThemes/pixely';
import { alignmentForumTheme } from './alignmentForumTheme'
import { eaForumTheme } from './eaTheme'
import { lessWrongTheme } from './lesswrongTheme'

export const getSiteTheme = (forumType: ForumTypeString): SiteThemeSpecification => {
  const forumThemes: Record<ForumTypeString, SiteThemeSpecification> = {
    AlignmentForum: alignmentForumTheme,
    EAForum: eaForumTheme,
    LessWrong: pixelyTheme,
  }
  if (!forumThemes[forumType]) throw Error(`No theme for forum type ${forumType}`);

  return forumThemes[forumType];
}
