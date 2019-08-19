import { getSetting } from 'meteor/vulcan:core'

let forumTheme
switch (getSetting('forumType')) {
  case 'AlignmentForum':
    import afTheme from '../themes/alignmentForumTheme'
    forumTheme = afTheme
    break
  case 'EAForum':
    import eaTheme from '../themes/eaTheme'
    forumTheme = eaTheme
    break
  default:
    import lwTheme from '../themes/lesswrongTheme'
    forumTheme = lwTheme
}

const forumThemeExport = forumTheme;
export default forumThemeExport
