/**
 * Standard rejection intro, shown above (and prepended to) the moderator-written
 * rejection reason. Rendered read-only in the UI; the server adds it to the
 * message the user actually receives.
 */
export const standardRejectionIntroHtml = `
  <p>Unfortunately, I rejected your [content].</p>
  <p>LessWrong aims for particularly high quality (and somewhat oddly-specific) discussion quality. We get a lot of content from new users and sadly can't give detailed feedback on every piece we reject, but I generally recommend checking out our <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</a>, in particular the section on <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong#How_to_ensure_your_first_post_or_comment_is_well_received">how to ensure your content is approved</a>.</p>
  <p>Your content didn't meet the bar for at least the following reason(s):</p>
`;

/** Single-line version of the intro, for the collapsed state of the rejection composer. */
export const standardRejectionIntroPlaintext = standardRejectionIntroHtml
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
