import { DatabaseIndexSet, mergeDatabaseIndexSets } from "../../lib/utils/databaseIndexSet";
import { getFacetFieldIndexes } from "../search/facetFieldSearch";

export function getDbIndexesOnUsers() {
  const indexSet = new DatabaseIndexSet();

  // Auto-generated indexes from production
  indexSet.addIndex("Users", {username:1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {email:1}, {sparse:1});
  indexSet.addIndex("Users", {"emails.address":1}, {unique:true,sparse:1}); //TODO: deprecate emails field – do not build upon
  indexSet.addIndex("Users", {"services.resume.loginTokens.hashedToken":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.resume.loginTokens.token":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.resume.haveLoginTokensToDelete":1}, {sparse:1});
  indexSet.addIndex("Users", {"services.resume.loginTokens.when":1}, {sparse:1});
  indexSet.addIndex("Users", {"services.email.verificationTokens.token":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.password.reset.token":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.password.reset.when":1}, {sparse:1});
  indexSet.addIndex("Users", {"services.twitter.id":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.facebook.id":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {"services.google.id":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {karma:-1,_id:-1});
  indexSet.addIndex("Users", {slug:1});
  indexSet.addIndex("Users", {isAdmin:1});
  indexSet.addIndex("Users", {"services.github.id":1}, {unique:true,sparse:1});
  indexSet.addIndex("Users", {createdAt:-1,_id:-1});
  
  // Used by UsersRepo.getUserByLoginToken
  indexSet.addIndex("Users", {"services.resume.loginTokens": 1});
  
  // Case-insensitive email index
  indexSet.addIndex("Users", {email: 1}, {sparse: 1, collation: { locale: 'en', strength: 2 }})
  indexSet.addIndex("Users", {'emails.address': 1}, {sparse: 1, unique: true, collation: { locale: 'en', strength: 2 }}) //TODO: Deprecate or change to use email
  
  indexSet.addIndex("Users", {oldSlugs:1});
  
  indexSet.addIndex("Users", {bannedPersonalUserIds:1, createdAt:1});
  indexSet.addIndex("Users", {bannedUserIds:1, createdAt:1});
  
  indexSet.addIndex("Users", {needsReview: 1, signUpReCaptchaRating: 1, createdAt: -1})
  
  indexSet.addIndex("Users", {banned: 1, postCount: 1, commentCount: -1, lastNotificationsCheck: -1})
  
  indexSet.addIndex("Users", {reviewedAt: -1, createdAt: -1})
  indexSet.addIndex("Users", {mapLocationSet: 1})
  indexSet.addIndex("Users", {profileTagIds: 1, deleted: 1, deleteContent: 1, karma: 1})
  
  indexSet.addIndex("Users", { optedInToDialogueFacilitation: 1, karma: -1 });
  
  // These partial indexes are set up to allow for a very efficient index-only scan when deciding which userIds need to be emailed for post curation.
  // Used by `CurationEmailsRepo.getUserIdsToEmail`.
  // The EA Forum version of the index is missing the fm_has_verified_email conditional to match the behavior of `reasonUserCantReceiveEmails`.
  indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Users_subscribed_to_curated_verified"
    ON "Users" USING btree (
      "emailSubscribedToCurated",
      "unsubscribeFromAll",
      "deleted",
      "email",
      fm_has_verified_email(emails),
      "_id"
    )
    WHERE "emailSubscribedToCurated" IS TRUE
      AND "unsubscribeFromAll" IS NOT TRUE
      AND "deleted" IS NOT TRUE
      AND "email" IS NOT NULL
      AND fm_has_verified_email(emails);
  `, {
    dependencies: [
      {type: "function", name: "fm_has_verified_email"}
    ],
  });
  
  indexSet.addCustomPgIndex(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_Users_subscribed_to_curated"
    ON "Users" USING btree (
      "emailSubscribedToCurated",
      "unsubscribeFromAll",
      "deleted",
      "email",
      "_id"
    )
    WHERE "emailSubscribedToCurated" IS TRUE
      AND "unsubscribeFromAll" IS NOT TRUE
      AND "deleted" IS NOT TRUE
      AND "email" IS NOT NULL;
  `);

  indexSet.addIndex("Users", { afKarma:1, reviewForAlignmentForumUserId:1, groups:1, createdAt:1 });
  indexSet.addIndex("Users", { afSubmittedApplication:1, reviewForAlignmentForumUserId:1, groups:1, createdAt:1 });
  indexSet.addIndex("Users", {nearbyEventsNotificationsMongoLocation: "2dsphere"}, {name: "users.nearbyEventsNotifications"})

  return mergeDatabaseIndexSets([ 
    indexSet,
    getFacetFieldIndexes(),
  ]);
}
