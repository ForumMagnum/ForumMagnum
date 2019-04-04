import { getSetting } from 'meteor/vulcan:core'

import lwTheme from '../themes/lesswrongTheme'
import afTheme from '../themes/alignmentForumTheme'
import eaTheme from '../themes/eaTheme'

const themes = {
  'LessWrong': lwTheme,
  'AlignmentForum': afTheme,
  'EAForum': eaTheme
}

const forumTheme = themes[getSetting('forumType')]

export default forumTheme
