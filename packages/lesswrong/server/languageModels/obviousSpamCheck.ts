import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import { AI_DETECTED_OBVIOUS_SPAM } from "@/lib/collections/moderatorActions/constants";
import { getAnthropicClientOrThrow } from "./anthropicClient";
import { dataToMarkdown } from "@/server/editor/conversionUtils";
import { getLatestContentsRevision } from "@/server/collections/revisions/helpers";
import { createModeratorAction } from "@/server/collections/moderatorActions/mutations";

const SPAM_CHECK_MODEL = "claude-opus-4-8";
const MAX_POSTS = 10;
const MAX_COMMENTS = 20;
const MAX_WIKI_REVISIONS = 10;
const MAX_CHARS_PER_ITEM = 3000;

const spamVerdictSchema = z.object({
  isObviousSpam: z.boolean(),
  reasoning: z.string(),
});

function truncateForPrompt(text: string, maxChars = MAX_CHARS_PER_ITEM): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n[...truncated]`;
}

function htmlToPromptMarkdown(html: string | null | undefined): string {
  if (!html) return "";
  return truncateForPrompt(dataToMarkdown(html, "html").trim());
}

function buildUserProfileSection(user: DbUser): string {
  const lines: string[] = [
    `Username: ${user.username ?? "(none)"}`,
    `Display name: ${user.displayName ?? "(none)"}`,
    `Full name: ${user.fullName ?? "(none)"}`,
    `Account created: ${user.createdAt?.toISOString() ?? "(unknown)"}`,
    `Karma: ${user.karma ?? 0}`,
    `Job title: ${user.jobTitle ?? "(none)"}`,
    `Organization: ${user.organization ?? "(none)"}`,
    `Website: ${user.website ?? "(none)"}`,
    `LinkedIn: ${user.linkedinProfileURL ?? "(none)"}`,
    `GitHub: ${user.githubProfileURL ?? "(none)"}`,
    `Twitter: ${user.twitterProfileURL ?? "(none)"}`,
    `Bluesky: ${user.blueskyProfileURL ?? "(none)"}`,
    `Has profile image: ${user.profileImageId ? "yes" : "no"}`,
  ];

  const biography = htmlToPromptMarkdown(user.biography?.html);
  lines.push(`Bio: ${biography || "(none)"}`);

  const howOthersCanHelpMe = htmlToPromptMarkdown(user.howOthersCanHelpMe?.html);
  if (howOthersCanHelpMe) {
    lines.push(`"How others can help me": ${howOthersCanHelpMe}`);
  }
  const howICanHelpOthers = htmlToPromptMarkdown(user.howICanHelpOthers?.html);
  if (howICanHelpOthers) {
    lines.push(`"How I can help others": ${howICanHelpOthers}`);
  }

  if (user.mapLocation) {
    const formattedAddress = user.mapLocation?.formatted_address ?? JSON.stringify(user.mapLocation);
    lines.push(`Map pin location: ${truncateForPrompt(String(formattedAddress), 500)}`);
  } else {
    lines.push("Map pin location: (none)");
  }
  if (user.mapMarkerText) {
    lines.push(`Map pin text: ${truncateForPrompt(user.mapMarkerText, 1000)}`);
  }

  return lines.join("\n");
}

async function buildUserContentSections(user: DbUser, context: ResolverContext): Promise<string> {
  const { Posts, Comments, Revisions } = context;

  const [posts, comments, wikiRevisions] = await Promise.all([
    Posts.find({ userId: user._id, draft: false }, { sort: { postedAt: 1 }, limit: MAX_POSTS }).fetch(),
    Comments.find({ userId: user._id, deleted: false }, { sort: { postedAt: 1 }, limit: MAX_COMMENTS }).fetch(),
    Revisions.find(
      { userId: user._id, collectionName: { $in: ["Tags", "MultiDocuments"] }, draft: { $ne: true } },
      { sort: { createdAt: 1 }, limit: MAX_WIKI_REVISIONS }
    ).fetch(),
  ]);

  const postSections = await Promise.all(posts.map(async (post) => {
    const revision = await getLatestContentsRevision(post, context);
    const body = htmlToPromptMarkdown(revision?.html);
    return `### Post: "${post.title}"\n${body || "(no body)"}`;
  }));

  const commentSections = await Promise.all(comments.map(async (comment) => {
    const revision = await getLatestContentsRevision(comment, context);
    const body = htmlToPromptMarkdown(revision?.html);
    return `### Comment\n${body || "(no body)"}`;
  }));

  const wikiSections = wikiRevisions.map((revision) => {
    const body = htmlToPromptMarkdown(revision.html);
    return `### Wikitag edit (${revision.collectionName ?? "unknown"} ${revision.documentId ?? ""})\n${body || "(no body)"}`;
  });

  const sections: string[] = [];
  sections.push(posts.length ? `## Posts (${posts.length})\n\n${postSections.join("\n\n")}` : "## Posts\n(none)");
  sections.push(comments.length ? `## Comments (${comments.length})\n\n${commentSections.join("\n\n")}` : "## Comments\n(none)");
  sections.push(wikiRevisions.length ? `## Wikitag edits (${wikiRevisions.length})\n\n${wikiSections.join("\n\n")}` : "## Wikitag edits\n(none)");
  return sections.join("\n\n");
}

const SPAM_CHECK_SYSTEM_PROMPT = `You are assisting the moderation team of LessWrong, a discussion forum about rationality, AI, and related topics. You will be shown the profile and content of a newly-registered user who has just entered the moderation review queue.

Your only job is to determine whether this account is VERY OBVIOUSLY spam. Obvious spam means things like:
- Commercial promotion or advertising (SEO link-building, promoting products/services/businesses, crypto/gambling/loan/escort promotion, etc.)
- Bios, map pins, or content stuffed with promotional links or keywords
- Scam or phishing content
- Machine-generated gibberish with no relation to the site's subject matter

Err on the side of "no". A confused newbie, a low-quality-but-sincere poster, an AI-assisted but on-topic writer, or an empty profile is NOT obvious spam. Only answer "yes" when a human moderator glancing at the account would immediately and confidently conclude it's spam.

Respond with ONLY a JSON object, no other text, in this exact format:
{"isObviousSpam": true or false, "reasoning": "one or two sentences explaining your verdict"}`;

export async function getObviousSpamVerdict(user: DbUser, context: ResolverContext) {
  const profileSection = buildUserProfileSection(user);
  const contentSection = await buildUserContentSections(user, context);
  const userPrompt = `# User profile\n${profileSection}\n\n${contentSection}\n\nIs this account very obviously spam?`;

  const client = getAnthropicClientOrThrow();
  const result = await client.messages.create({
    model: SPAM_CHECK_MODEL,
    max_tokens: 1000,
    system: SPAM_CHECK_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseBlock = result.content[0];
  if (responseBlock?.type !== "text") {
    throw new Error("Obvious-spam check returned a non-text response");
  }

  const jsonMatch = responseBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Obvious-spam check response contained no JSON: ${responseBlock.text}`);
  }
  return spamVerdictSchema.parse(JSON.parse(jsonMatch[0]));
}

/**
 * Called (as a background task) when a user enters the moderation review
 * queue. If the user has never been reviewed, asks Claude whether the account
 * is very obviously spam, and if so creates an "AI says 'Obvious Spam'"
 * moderator action so the moderator reviewing them sees it immediately.
 */
export async function checkNewUserForObviousSpam(userId: string, context: ResolverContext) {
  try {
    const { Users, ModeratorActions } = context;
    const user = await Users.findOne({ _id: userId });
    if (!user) return;

    // Only run for users who have never been reviewed
    if (user.reviewedByUserId || user.reviewedAt) return;

    // Don't re-flag a user who already has this action
    const existingAction = await ModeratorActions.findOne({ userId, type: AI_DETECTED_OBVIOUS_SPAM });
    if (existingAction) return;

    const verdict = await getObviousSpamVerdict(user, context);
    if (!verdict.isObviousSpam) return;

    await createModeratorAction({
      data: {
        userId,
        type: AI_DETECTED_OBVIOUS_SPAM,
      },
    }, context);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Obvious-spam check failed for user", userId, error);
    captureException(error);
  }
}
