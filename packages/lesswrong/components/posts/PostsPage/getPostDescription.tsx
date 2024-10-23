import { forumTitleSetting } from "@/lib/instanceSettings";
import { POST_DESCRIPTION_EXCLUSIONS } from "./PostsPage";

/** Get a og:description-appropriate description for a post */

export const getPostDescription = (post: {
  contents?: { plaintextDescription: string | null; } | null;
  customHighlight?: { plaintextDescription: string | null; } | null;
  socialPreviewData?: { text: string | null; } | null;
  shortform: boolean;
  user: { displayName: string; } | null;
}) => {
  if (post.socialPreviewData?.text) {
    return post.socialPreviewData.text;
  }

  const longDescription = post.customHighlight?.plaintextDescription || post.contents?.plaintextDescription;
  if (longDescription) {
    // concatenate the first few paragraphs together up to some reasonable length
    const plaintextPars = longDescription
      // paragraphs in the plaintext description are separated by double-newlines
      .split(/\n\n/)
      // get rid of bullshit opening text ('epistemic status' or 'crossposted from' etc)
      .filter((par) => !POST_DESCRIPTION_EXCLUSIONS.some((re) => re.test(par)));

    if (!plaintextPars.length) return "";

    // concatenate paragraphs together with a delimiter, until they reach an
    // acceptable length (target is 100-200 characters)
    // this will return a longer description if one of the first couple of
    // paragraphs is longer than 200
    let firstFewPars = plaintextPars[0];
    for (const par of plaintextPars.slice(1)) {
      const concat = `${firstFewPars} • ${par}`;
      // If we're really short, we need more
      if (firstFewPars.length < 40) {
        firstFewPars = concat;
        continue;
      }
      // Otherwise, if we have room for the whole next paragraph, concatenate it
      if (concat.length < 150) {
        firstFewPars = concat;
        continue;
      }
      // If we're here, we know we have enough and couldn't fit the last
      // paragraph, so we should stop
      break;
    }
    if (firstFewPars.length > 148) {
      return firstFewPars.slice(0, 149).trim() + "…";
    }
    return firstFewPars + " …";
  }
  if (post.shortform)
    return `A collection of shorter posts ${post.user ? `by ${forumTitleSetting.get()} user ${post.user.displayName}` : ""}`;
  return null;
};
