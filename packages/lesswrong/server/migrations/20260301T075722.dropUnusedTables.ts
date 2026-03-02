import { dropField, dropTable } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  await dropTable(db, "AdvisorRequests");
  await dropTable(db, "GardenCodes");
  await dropTable(db, "ElectionCandidates");
  await dropTable(db, "ElectionVotes");
  await dropTable(db, "FeaturedResources");
  await dropTable(db, "Surveys");
  await dropTable(db, "SurveyQuestions");
  await dropTable(db, "SurveyResponses");
  await dropTable(db, "SurveySchedules");
  await dropTable(db, "UserJobAds");
  await dropTable(db, "UserEAGDetails");
  await dropTable(db, "DigestPosts");
  await dropTable(db, "Digests");
  
  // Split into a separate PR/separate migration to avoid brief downtime during deploy
  //await dropTable(db, "ForumEvents");
  //await dropField(db, "Comments", "forumEventId");
  //await dropField(db, "Comments", "forumEventMetadata");
  //await dropField(db, "Comments", "subforumStickyPriority");
  //await dropField(db, "Users", "optedOutOfSurveys");
  //await dropField(db, "Users", "inactiveSurveyEmailSentAt");
  //await dropField(db, "Users", "userSurveyEmailSentAt");
  //await dropField(db, "Users", "hideJobAdUntil");
  //await dropField(db, "Users", "subscribedToDigest");
  //await dropField(db, "Users", "subscribedToNewsletter");
}

export const down = async ({db}: MigrationContext) => {
}
