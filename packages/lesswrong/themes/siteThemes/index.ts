import { ForumTypeString } from '../../lib/instanceSettings';
import { alignmentForumTheme } from './alignmentForumTheme'
import { eaForumTheme } from './eaTheme'
import { lessWrongTheme } from './lesswrongTheme'

export const getSiteTheme = (forumType: ForumTypeString): SiteThemeSpecification => {
  switch (forumType) {
    case 'AlignmentForum': return alignmentForumTheme;
    case 'EAForum': return eaForumTheme;
    case "LessWrong": return lessWrongTheme;
    default: return lessWrongTheme;
  }
}
