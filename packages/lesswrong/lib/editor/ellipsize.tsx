import { truncatise } from '../truncatise';

const highlightMaxChars = 2400;
export const GTP2_TRUNCATION_CHAR_COUNT = 400;
export const SMALL_TRUNCATION_CHAR_COUNT = 750;
export const LARGE_TRUNCATION_CHAR_COUNT = 1600;
export const TRUNCATION_KARMA_THRESHOLD = 10

export const highlightFromHTML = (html: string): string => {
  if (!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  return truncatise(htmlRemovedStyles, {
    TruncateLength: highlightMaxChars,
    TruncateBy: "characters",
    Suffix: `... ${styles}`,
  });
};

export const truncate = (html: string|null|undefined, truncateLength: number, truncateBy?: string, suffix?: string) => {
  const newTruncateBy = truncateBy || "characters"
  const newSuffix = (suffix !== undefined) ? suffix : "..."

  if(!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  const truncatedHtml = truncatise(htmlRemovedStyles, {
    TruncateLength: Math.floor(truncateLength - (truncateLength/4)) || truncateLength,
    TruncateBy: newTruncateBy,
    Suffix: `${newSuffix}`,
  });
  return styles + truncatedHtml;
}

export function getTruncationCharCount (comment: CommentsList, currentUser?: UsersCurrent|null, postPage?: boolean) {
  // Do not truncate for users who have disabled it in their user settings. Might want to do someting more elegant here someday.
  if (currentUser && currentUser.noCollapseCommentsPosts && postPage) {
    return 10000000
  }
  if (currentUser && currentUser.noCollapseCommentsFrontpage && !postPage) {
    return 10000000
  }
  const commentIsByGPT2 = !!(comment && comment.user && comment.user.displayName === "GPT2")
  if (commentIsByGPT2) return GTP2_TRUNCATION_CHAR_COUNT

  const commentIsRecent = comment.postedAt > new Date(new Date().getTime()-(2*24*60*60*1000)); // past 2 days
  const commentIsHighKarma = comment.baseScore >= TRUNCATION_KARMA_THRESHOLD
  
  if (postPage) {
    return (commentIsRecent || commentIsHighKarma) ? LARGE_TRUNCATION_CHAR_COUNT : SMALL_TRUNCATION_CHAR_COUNT
  } else {
    return SMALL_TRUNCATION_CHAR_COUNT
  }
}

export const answerTocExcerptFromHTML = (html: string): string => {
  if(!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  const firstParagraph = truncatise(htmlRemovedStyles, {
    TruncateLength: 1,
    TruncateBy: "paragraph",
    Suffix: '',
  });

  return truncatise(firstParagraph, {
    TruncateLength: 70,
    TruncateBy: "characters",
    Suffix: `...${styles}`,
  });
};

export function commentExcerptFromHTML (comment: CommentsList, currentUser?: UsersCurrent|null, postPage?: boolean) {
  const html = comment.contents?.html;
  if(!html) return ""
  const styles = html.match(/<style[\s\S]*?<\/style>/g) || ""
  const htmlRemovedStyles = html.replace(/<style[\s\S]*?<\/style>/g, '');

  const truncationCharCount = getTruncationCharCount(comment, currentUser, postPage)

  if (htmlRemovedStyles.length > truncationCharCount) {
    return truncatise(htmlRemovedStyles, {
      // We want the amount comments get truncated to to be less than the threshold at which they are truncated, so that users don't have the experience of expanding a comment only to see a couple more words (which just feels silly).
  
      // This varies by the size of the comment or truncation amount, and reducing it by 1/4th seems about right.
      TruncateLength: Math.floor(truncationCharCount - (truncationCharCount/4)),
      TruncateBy: "characters",
      Suffix: `... <span class="read-more-button">(read more)</span>${styles}`,
    });
  } else {
    return htmlRemovedStyles
  }
};

