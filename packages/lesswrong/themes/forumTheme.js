import { getSetting } from 'meteor/vulcan:core'

import lwTheme from '../themes/lesswrongTheme'
import eaTheme from '../themes/eaTheme'

const forumTheme = getSetting('EAForum') ? eaTheme : lwTheme

export default forumTheme
