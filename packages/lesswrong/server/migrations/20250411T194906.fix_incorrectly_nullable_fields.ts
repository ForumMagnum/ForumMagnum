import Bans from "../collections/bans/collection";
import Comments from "../collections/comments/collection";
import ElectionCandidates from "../collections/electionCandidates/collection";
import ForumEvents from "../collections/forumEvents/collection";
import Posts from "../collections/posts/collection";
import Revisions from "../collections/revisions/collection";
import TagRels from "../collections/tagRels/collection";
import Users from "../collections/users/collection";
import { updateDefaultValue, dropRemovedField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  // eslint-disable-next-line no-console
  console.log('Updating Bans.comment default value');

  // Bans.comment - update default value
  await updateDefaultValue(db, Bans, 'comment');

  // eslint-disable-next-line no-console
  console.log('Updating Comments.inactive default value');

  // Comments.inactive - update default value
  await updateDefaultValue(db, Comments, 'inactive');

  // eslint-disable-next-line no-console
  console.log('Updating ElectionCandidates.inactive default value');

  // ElectionCandidates.inactive - update default value
  await updateDefaultValue(db, ElectionCandidates, 'inactive');

  // eslint-disable-next-line no-console
  console.log('Updating ElectionCandidates.extendedScore, afBaseScore, afExtendedScore, and afVoteCount to nullable');

  // ElectionCandidates.extendedScore, afBaseScore, afExtendedScore, and afVoteCount - make nullable
  await db.none(`ALTER TABLE "ElectionCandidates"
    ALTER COLUMN "extendedScore" DROP NOT NULL,
    ALTER COLUMN "afBaseScore" DROP NOT NULL,
    ALTER COLUMN "afExtendedScore" DROP NOT NULL,
    ALTER COLUMN "afVoteCount" DROP NOT NULL
  `);

  // eslint-disable-next-line no-console
  console.log('Updating ForumEvents.darkColor and ForumEvents.lightColor default values');

  // ForumEvents.darkColor and ForumEvents.lightColor - update default value
  await updateDefaultValue(db, ForumEvents, 'darkColor');
  await updateDefaultValue(db, ForumEvents, 'lightColor');

  // eslint-disable-next-line no-console
  console.log('Updating Posts.inactive default value');

  // Posts.inactive - update default value
  await updateDefaultValue(db, Posts, 'inactive');

  // eslint-disable-next-line no-console
  console.log('Revisions.inactive - drop removed field');

  // Revisions.inactive - drop removed field
  await dropRemovedField(db, Revisions, 'inactive');

  // eslint-disable-next-line no-console
  console.log('Tags.needsReview and descriptionTruncationCount - update null values to default and make not null');

  // Tags.needsReview and descriptionTruncationCount - update null values to default and make not null
  await db.none('UPDATE "Tags" SET "needsReview" = FALSE WHERE "needsReview" IS NULL');
  await db.none('UPDATE "Tags" SET "descriptionTruncationCount" = 0 WHERE "descriptionTruncationCount" IS NULL');

  await db.none(`ALTER TABLE "Tags"
    ALTER COLUMN "needsReview" SET NOT NULL,
    ALTER COLUMN "descriptionTruncationCount" SET NOT NULL
  `);

  // eslint-disable-next-line no-console
  console.log('Tags.oldSlugs - set default value, update null values to default, and make not null');

  // Tags.oldSlugs - set default value, update null values to default, and make not null
  await db.none(`ALTER TABLE "Tags" ALTER COLUMN "oldSlugs" SET DEFAULT '{}'::TEXT[]`);
  await db.none(`UPDATE "Tags" SET "oldSlugs" = '{}'::TEXT[] WHERE "oldSlugs" IS NULL`);
  await db.none(`ALTER TABLE "Tags" ALTER COLUMN "oldSlugs" SET NOT NULL`);

  // eslint-disable-next-line no-console
  console.log('TagRels.inactive - update default value');

  // TagRels.inactive - update default value
  await updateDefaultValue(db, TagRels, 'inactive');

  // eslint-disable-next-line no-console
  console.log('Users.isAdmin - update default value');

  // Users.isAdmin - update default value
  await updateDefaultValue(db, Users, 'isAdmin');

  // eslint-disable-next-line no-console
  console.log('Users.slug, notificationKarmaPowersGained, and notificationNewDialogueChecks - make not null');

  // Users.slug, notificationKarmaPowersGained, and notificationNewDialogueChecks - make not null
  await db.none(`ALTER TABLE "Users"
    ALTER COLUMN "slug" SET NOT NULL,
    ALTER COLUMN "notificationKarmaPowersGained" SET NOT NULL,
    ALTER COLUMN "notificationNewDialogueChecks" SET NOT NULL
  `);

  // eslint-disable-next-line no-console
  console.log('Users.oldSlugs - set default value, update null values to default, and make not null');

  // Users.oldSlugs - set default value, update null values to default, and make not null
  await db.none(`ALTER TABLE "Users" ALTER COLUMN "oldSlugs" SET DEFAULT '{}'::TEXT[]`);
  await db.none(`UPDATE "Users" SET "oldSlugs" = '{}'::TEXT[] WHERE "oldSlugs" IS NULL`);
  await db.none(`ALTER TABLE "Users" ALTER COLUMN "oldSlugs" SET NOT NULL`);
}

export const down = async ({db}: MigrationContext) => {
}
