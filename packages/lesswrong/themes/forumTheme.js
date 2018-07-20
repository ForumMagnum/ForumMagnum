import { getSetting } from 'meteor/vulcan:core'

import lwTheme from '../themes/lesswrongTheme'
import eaForumTheme from '../themes/eaForumTheme'

const forumTheme = getSetting('EAForum', false) ? eaForumTheme : lwTheme

export default forumTheme
