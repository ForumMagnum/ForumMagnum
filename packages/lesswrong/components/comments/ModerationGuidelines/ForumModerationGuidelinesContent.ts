import { getSetting } from '../../../lib/vulcan-lib';
import {frontpageGuidelinesLW, defaultGuidelinesLW} from './LWModerationGuidelinesContent'
import {frontpageGuidelinesEA, defaultGuidelinesEA} from './EAModerationGuidelinesContent'

export const frontpageGuidelines = getSetting('forumType') === 'EAForum' ? frontpageGuidelinesEA : frontpageGuidelinesLW
export const defaultGuidelines = getSetting('forumType') === 'EAForum' ? defaultGuidelinesEA : defaultGuidelinesLW

