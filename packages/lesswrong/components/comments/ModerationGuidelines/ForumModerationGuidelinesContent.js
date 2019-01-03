import { getSetting } from 'meteor/vulcan:core';
import {frontpageGuidelinesLW, defaultGuidelinesLW} from './LWModerationGuidelinesContent'
import {frontpageGuidelinesEA, defaultGuidelinesEA} from './EAModerationGuidelinesContent'

export const frontpageGuidelines = getSetting('EAForum') ? frontpageGuidelinesEA : frontpageGuidelinesLW
export const defaultGuidelines = getSetting('EAForum') ? defaultGuidelinesEA : defaultGuidelinesLW

