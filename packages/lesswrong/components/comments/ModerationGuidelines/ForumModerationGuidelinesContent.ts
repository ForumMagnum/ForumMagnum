import {frontpageGuidelinesLW, defaultGuidelinesLW} from './LWModerationGuidelinesContent'
import {frontpageGuidelinesEA, defaultGuidelinesEA} from './EAModerationGuidelinesContent'
import { isEAForum } from '../../../lib/instanceSettings';

export const getFrontpageGuidelines = () => isEAForum() ? frontpageGuidelinesEA : frontpageGuidelinesLW
export const getDefaultGuidelines = () => isEAForum() ? defaultGuidelinesEA : defaultGuidelinesLW

