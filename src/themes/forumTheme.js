import { getSetting } from 'meteor/vulcan:core'

import afTheme from '../themes/alignmentForumTheme'
import eaTheme from '../themes/eaTheme'
import lwTheme from '../themes/lesswrongTheme'

let forumTheme
switch (getSetting('forumType')) {
  case 'AlignmentForum':
    forumTheme = afTheme
    break
  case 'EAForum':
    forumTheme = eaTheme
    break
  default:
    forumTheme = lwTheme
}

export default forumTheme
