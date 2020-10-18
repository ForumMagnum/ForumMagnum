import {frontpageGuidelinesLW, defaultGuidelinesLW} from './LWModerationGuidelinesContent'
import {frontpageGuidelinesEA, defaultGuidelinesEA} from './EAModerationGuidelinesContent'
import { forumTypeSetting } from '../../../lib/instanceSettings';

export const frontpageGuidelines = forumTypeSetting.get() === 'EAForum' ? frontpageGuidelinesEA : frontpageGuidelinesLW
export const defaultGuidelines = forumTypeSetting.get() === 'EAForum' ? defaultGuidelinesEA : defaultGuidelinesLW

