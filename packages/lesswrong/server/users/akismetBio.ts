import { getSignatureWithNote } from "@/lib/collections/users/helpers";
import { akismetKeySetting } from "../databaseSettings";
import { checkUserBioForAkismetSpam } from "../akismet";

const AKISMET_BIO_FLAG_NOTE = "Profile bio was flagged as possible spam by Akismet. Review bio links before approving.";

export async function maybeFlagUserBioForSpamWithAkismet(updatedUser: DbUser, oldUser: DbUser, context: ResolverContext) {
  const newBioHtml = updatedUser.biography?.html ?? "";
  const oldBioHtml = oldUser.biography?.html ?? "";

  if (
    newBioHtml === oldBioHtml ||
    !newBioHtml.trim() ||
    updatedUser.reviewedByUserId ||
    !akismetKeySetting.get()
  ) {
    return;
  }

  const spam = await checkUserBioForAkismetSpam(updatedUser, context);
  if (!spam) return;

  const latestUser = await context.Users.findOne({_id: updatedUser._id});
  if (
    !latestUser ||
    latestUser.reviewedByUserId ||
    latestUser.biography?.html !== newBioHtml
  ) {
    return;
  }

  const oldNotes = latestUser.sunshineNotes ?? "";
  await context.Users.rawUpdateOne({
    _id: updatedUser._id,
    reviewedByUserId: null,
    "biography.html": newBioHtml,
    sunshineNotes: oldNotes,
  }, {
    $set: {
      needsReview: true,
      sunshineFlagged: true,
      sunshineNotes: `${getSignatureWithNote("Akismet", AKISMET_BIO_FLAG_NOTE)}${oldNotes}`,
    },
  });
}
