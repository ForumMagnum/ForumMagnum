import { sanitize } from "@/lib/utils/sanitize";

// TODO: test that this works correctly in both the case where it's called before make_editable and after make_editable callback that creates the normalized contents
export function sanitizeJargonTerm<T extends DbJargonTerm | CreateJargonTermDataInput | UpdateJargonTermDataInput>(jargonTerm: T) {
  const sanitizedJargonTerm = { ...jargonTerm };

  if (sanitizedJargonTerm.term) {
    sanitizedJargonTerm.term = sanitize(sanitizedJargonTerm.term);
  }

  if (sanitizedJargonTerm.contents && ('html' in sanitizedJargonTerm.contents) && sanitizedJargonTerm.contents?.html) {
    sanitizedJargonTerm.contents.html = sanitize(sanitizedJargonTerm.contents.html);
  }

  return sanitizedJargonTerm;
}
