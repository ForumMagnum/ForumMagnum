import { getSetting } from 'meteor/vulcan:core'

import lwTheme from '../themes/lesswrongTheme'
import afTheme from '../themes/alignmentForumTheme'
import aocTheme from '../themes/artOfCurrencyTheme'
// import eaTheme from '../themes/eaTheme'


const forumTheme = aocTheme //getSetting('AlignmentForum', false) ? afTheme : lwTheme

export default forumTheme
