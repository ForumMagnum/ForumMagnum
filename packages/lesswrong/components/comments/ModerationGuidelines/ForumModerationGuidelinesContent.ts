import { getSetting } from 'meteor/vulcan:core';
import {frontpageGuidelinesLW, defaultGuidelinesLW} from './LWModerationGuidelinesContent'
import {frontpageGuidelinesEA, defaultGuidelinesEA} from './EAModerationGuidelinesContent'

export const frontpageGuidelines = getSetting('forumType') === 'EAForum' ? frontpageGuidelinesEA : frontpageGuidelinesLW
export const defaultGuidelines = getSetting('forumType') === 'EAForum' ? defaultGuidelinesEA : defaultGuidelinesLW

