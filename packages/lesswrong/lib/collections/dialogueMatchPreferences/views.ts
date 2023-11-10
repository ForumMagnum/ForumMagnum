import {ensureIndex} from '../../collectionIndexUtils';
import { DialogueMatchPreferences } from './collection';

declare global {
  interface DialogueMatchPreferencesViewTerms extends ViewTermsBase {
    view?: DialogueMatchPreferencesViewName
  }
}

ensureIndex(DialogueMatchPreferences, { dialogueCheckId: 1 }, { unique: true });
