import { randomSecret } from "@/lib/random";

export function getRejectionMessage(rejectedContentLink: string, rejectedReason: string|null) {
  let messageContents = `
  <p>Unfortunately, I rejected your ${rejectedContentLink}.</p>
  <p>LessWrong aims for particularly high quality (and somewhat oddly-specific) discussion quality. We get a lot of content from new users and sadly can't give detailed feedback on every piece we reject, but I generally recommend checking out our <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong">New User's Guide</a>, in particular the section on <a href="https://www.lesswrong.com/posts/LbbrnRvc9QwjJeics/new-user-s-guide-to-lesswrong#How_to_ensure_your_first_post_or_comment_is_well_received">how to ensure your content is approved</a>.</p>`
  if (rejectedReason) {
    messageContents += `<p>Your content didn't meet the bar for at least the following reason(s):</p>
    <p>${rejectedReason}</p>`;
  }
  return messageContents;
}

export async function triggerReview(userId: string, context: ResolverContext, reason?: string) {
  const { Users } = context;
  // TODO: save the reason
  await  Users.rawUpdateOne({ _id: userId }, { $set: { needsReview: true } });
}

export function generateLinkSharingKey(): string {
  return randomSecret();
}
