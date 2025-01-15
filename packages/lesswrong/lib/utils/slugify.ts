import getSlug from 'speakingurl';
import { containsKana, fromKana } from "hepburn";

export const slugify = function (s: string): string {
  if (containsKana(s)) {
    s = fromKana(s);
  }

  var slug = getSlug(s, {
    truncate: 60
  });

  // can't have posts with an "edit" slug
  if (slug === 'edit') {
    slug = 'edit-1';
  }

  // If there is nothing in the string that can be slugified, just call it unicode
  if (slug === "") {
    slug = "unicode"
  }

  return slug;
};
