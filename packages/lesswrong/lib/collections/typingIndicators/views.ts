import TypingIndicators from "./collection";
import { ensureIndex } from '../../collectionIndexUtils';

declare global {
  interface TypingIndicatorsViewTerms extends ViewTermsBase {
    view?: TypingIndicatorsViewName,
    documentId?: string
  }
}

TypingIndicators.addView("typingIndicatorsForPost", function (terms: TypingIndicatorsViewTerms) {
  return {
    selector: {documentId: terms.documentId},
    options: {limit: 1}
  }
})
ensureIndex(TypingIndicators, { documentId: 1 })
