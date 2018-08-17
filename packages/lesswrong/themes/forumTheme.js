import { getSetting } from 'meteor/vulcan:core'

import lwTheme from './lesswrongTheme'
import eaForumTheme from './eaForumTheme'

const forumTheme = getSetting('EAForum') ? eaForumTheme : lwTheme

export default forumTheme
