import { generateText, Output } from "ai";
import { z } from "zod";
import { compile } from "html-to-text";
import moment from "moment";
import { captureException } from "@/lib/sentryWrapper";
import { getSignatureWithNote } from "@/lib/collections/users/helpers";
import { AUTO_PURGED_PROFILE_SPAM } from "@/lib/collections/moderatorActions/constants";
import { profileSpamAutoPurgeSetting } from "@/server/databaseSettings";
import { triggerReviewIfNeeded } from "@/server/callbacks/sunshineCallbackUtils";
import { updateUser } from "@/server/collections/users/mutations";
import { createModeratorAction } from "@/server/collections/moderatorActions/mutations";
import { adminAccountSetting } from "@/lib/instanceSettings";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const PROFILE_SPAM_MODEL = "anthropic/claude-sonnet-5.5";

// Backtested against 180 days of moderator decisions; edits here should be re-backtested.
const PROFILE_SPAM_SYSTEM_PROMPT = `You'll be shown a new LessWrong user's profile. Classify whether it's spam.

Answer with a verdict and a one-sentence reason. Verdicts:
- obvious_spam
- likely_spam
- unclear
- not_spam`;

const profileSpamVerdictSchema = z.object({
  verdict: z.enum(["obvious_spam", "likely_spam", "unclear", "not_spam"]),
  reason: z.string(),
});

type ProfileSpamVerdict = z.infer<typeof profileSpamVerdictSchema>;

// Keeps link URLs inline, since links are most of the signal in profile spam.
const bioToText = compile({ wordwrap: false });

const MAX_ACCOUNT_AGE_DAYS = 7;

function buildProfilePrompt(user: DbUser): string {
  const bio = bioToText(user.biography?.html ?? "").trim();
  const minutesSinceSignup = Math.round((Date.now() - new Date(user.createdAt).getTime()) / 60000);
  return `Display name: ${user.displayName}
Minutes between account creation and this profile edit: ${minutesSinceSignup}
Bio:
${bio}
Map marker text:
${user.mapMarkerText?.trim() || "(none)"}`;
}

async function classifyProfileSpam(user: DbUser): Promise<ProfileSpamVerdict | null> {
  try {
    const result = await generateText({
      model: PROFILE_SPAM_MODEL,
      system: PROFILE_SPAM_SYSTEM_PROMPT,
      prompt: buildProfilePrompt(user),
      output: Output.object({ schema: profileSpamVerdictSchema }),
      maxOutputTokens: 4000,
    });
    return result.output;
  } catch (err) {
    // Includes refusals, which produce no output; a missing verdict means no action.
    captureException(err);
    return null;
  }
}

/**
 * Only brand-new accounts with no posts or comments are eligible, so a wrong
 * purge never deletes anyone's content and can be fully undone by unbanning.
 */
async function isEligibleForAutoPurge(user: DbUser, context: ResolverContext): Promise<boolean> {
  if (user.reviewedByUserId || user.isAdmin || user.groups?.length || user.deleted) return false;
  if (user.banned && new Date(user.banned) > new Date()) return false;
  if (moment().diff(user.createdAt, "days", true) > MAX_ACCOUNT_AGE_DAYS) return false;

  const [post, comment] = await Promise.all([
    context.Posts.findOne({ userId: user._id }, {}, { _id: 1 }),
    context.Comments.findOne({ userId: user._id }, {}, { _id: 1 }),
  ]);
  return !post && !comment;
}

async function purgeProfileSpammer(user: DbUser, reason: string, context: ResolverContext) {
  const adminTeamAccountId = adminAccountSetting.get(context)?._id;
  const adminTeamAccount = adminTeamAccountId ? await context.Users.findOne({ _id: adminTeamAccountId }) : null;
  if (!adminTeamAccount) return;
  const adminContext = computeContextFromUser({ user: adminTeamAccount, isSSR: false, forumType: context.forumType });

  const note = getSignatureWithNote(adminTeamAccount.displayName, `Auto-purged (profile spam classifier): ${reason}`);
  await updateUser({
    selector: { _id: user._id },
    data: {
      sunshineFlagged: false,
      reviewedByUserId: adminTeamAccount._id,
      reviewedAt: new Date(),
      needsReview: false,
      nullifyVotes: true,
      deleteContent: true,
      banned: moment().add(1000, "years").toDate(),
      sunshineNotes: note + (user.sunshineNotes ?? ""),
      // Banned users' profiles stay public, so remove the spam itself; the bio
      // remains recoverable from Revisions.
      biography: null,
      biography_latest: null,
      mapLocation: null,
      mapLocationSet: false,
      mapMarkerText: null,
      htmlMapMarkerText: null,
    },
  }, adminContext);

  // Created after the update so its sunshine note isn't overwritten by the one above.
  await createModeratorAction({ data: { userId: user._id, type: AUTO_PURGED_PROFILE_SPAM } }, adminContext);
}

async function maybeAutoPurgeProfileSpam(userId: string, context: ResolverContext) {
  if (!profileSpamAutoPurgeSetting.get(context)) return;

  const user = await context.Users.findOne({ _id: userId });
  if (!user || !(await isEligibleForAutoPurge(user, context))) return;

  const verdict = await classifyProfileSpam(user);
  if (verdict?.verdict !== "obvious_spam") return;

  await purgeProfileSpammer(user, verdict.reason, context);
}

/**
 * Runs the purge only after the review trigger has finished, since the trigger
 * sets needsReview and would otherwise put a purged user back in the queue.
 */
export async function triggerReviewAndMaybeAutoPurgeProfileSpam(
  userId: string,
  reviewTrigger: "biography" | "mapLocation" | "profileImageId",
  context: ResolverContext,
) {
  await triggerReviewIfNeeded(userId, reviewTrigger, context);
  if (reviewTrigger === "biography" || reviewTrigger === "mapLocation") {
    await maybeAutoPurgeProfileSpam(userId, context);
  }
}
