import { getSetting } from '../lib/vulcan-lib';

let forumTheme
switch (getSetting('forumType')) {
  case 'AlignmentForum':
    // @ts-ignore
    import afTheme from '../themes/alignmentForumTheme'
    forumTheme = afTheme
    break
  case 'EAForum':
    // @ts-ignore
    import eaTheme from '../themes/eaTheme'
    forumTheme = eaTheme
    break
  default:
    // @ts-ignore
    import lwTheme from '../themes/lesswrongTheme'
    forumTheme = lwTheme
}

const forumThemeExport = forumTheme;
export default forumThemeExport
