import { Bans } from "../server/collections/bans/collection";
import { ClientIds } from "../server/collections/clientIds/collection";
import Collections from "../server/collections/collections/collection";
import Comments from "../server/collections/comments/collection";
import Conversations from "../server/collections/conversations/collection";
import Localgroups from "../server/collections/localgroups/collection";
import Messages from "../server/collections/messages/collection";
import { ModeratorActions } from "../server/collections/moderatorActions/collection";
import Notifications from "../server/collections/notifications/collection";
import { PetrovDayLaunchs } from "../server/collections/petrovDayLaunchs/collection";
import Posts from "../server/collections/posts/collection";
import ReadStatuses from "../server/collections/readStatus/collection";
import Reports from "../server/collections/reports/collection";
import Revisions from "../server/collections/revisions/collection";
import RSSFeeds from "../server/collections/rssfeeds/collection";
import Sequences from "../server/collections/sequences/collection";
import { Subscriptions } from "../server/collections/subscriptions/collection";
import TagRels from "../server/collections/tagRels/collection";
import Tags from "../server/collections/tags/collection";
import UserMostValuablePosts from "../server/collections/userMostValuablePosts/collection";
import Users from "../server/collections/users/collection";
import UserTagRels from "../server/collections/userTagRels/collection";
import { Votes } from "../server/collections/votes/collection";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { writeFile } from "fs/promises";
import CkEditorUserSessions from "@/server/collections/ckEditorUserSessions/collection";
import CurationEmails from "@/server/collections/curationEmails/collection";
import DialogueChecks from "@/server/collections/dialogueChecks/collection";
import ElectionVotes from "@/server/collections/electionVotes/collection";
import ElicitQuestionPredictions from "@/server/collections/elicitQuestionPredictions/collection";
import GardenCodes from "@/server/collections/gardencodes/collection";
import GoogleServiceAccountSessions from "@/server/collections/googleServiceAccountSessions/collection";
import { LWEvents } from "@/server/collections/lwevents/collection.ts";
import PostRecommendations from "@/server/collections/postRecommendations/collection";
import RecommendationsCaches from "@/server/collections/recommendationsCaches/collection";
import ReviewVotes from "@/server/collections/reviewVotes/collection";
import TypingIndicators from "@/server/collections/typingIndicators/collection";
import UserEAGDetails from "@/server/collections/userEAGDetails/collection";
import UserJobAds from "@/server/collections/userJobAds/collection";
import { UserRateLimits } from "@/server/collections/userRateLimits/collection.ts";

type Entry<N extends CollectionNameString> = [
  CollectionBase<N>,
  {fetch: () => Promise<ObjectsByCollectionName[N][]>},
];

/**
 * Please ensure that we know that the user is who they say they are!
 * Exported to allow running with "yarn repl".
 */
export const exportUserData = async (
  selector: {_id?: string, slug?: string, email?: string},
  outfile?: string,
) => {
  if (!selector._id && !selector.slug && !selector.email) {
    throw new Error("Must specify either an _id, slug or email");
  }

  const user = await Users.findOne(selector);
  if (!user) {
    throw new Error("User not found: " + JSON.stringify(selector));
  }

  const userId = user._id;
  const email = user.email;

  const entries: Entry<CollectionNameString>[] = [
    [Users, {fetch: () => Promise.resolve([user])}],
    [Bans, Bans.find({userId})],
    [CkEditorUserSessions, CkEditorUserSessions.find({userId})],
    [ClientIds, ClientIds.find({userIds: userId})],
    [Collections, Collections.find({userId})],
    [Comments, Comments.find({userId})],
    [Conversations, Conversations.find({participantIds: userId})],
    [CurationEmails, CurationEmails.find({userId})],
    [DialogueChecks, DialogueChecks.find({userId})],
    [GardenCodes, GardenCodes.find({userId})],
    [GoogleServiceAccountSessions, GoogleServiceAccountSessions.find({email})],
    [ElectionVotes, ElectionVotes.find({userId})],
    [ElicitQuestionPredictions, ElicitQuestionPredictions.find({userId})],
    [PostRecommendations, PostRecommendations.find({userId})],
    [RecommendationsCaches, RecommendationsCaches.find({userId})],
    [ReviewVotes, ReviewVotes.find({userId})],
    [TypingIndicators, TypingIndicators.find({userId})],
    [UserEAGDetails, UserEAGDetails.find({userId})],
    [UserJobAds, UserJobAds.find({userId})],
    [UserRateLimits, UserRateLimits.find({userId})],
    [LWEvents, LWEvents.find({userId})],
    [Localgroups, Localgroups.find({organizerIds: userId})],
    [Messages, Messages.find({userId})],
    [ModeratorActions, ModeratorActions.find({userId})],
    [Notifications, Notifications.find({userId})],
    [PetrovDayLaunchs, PetrovDayLaunchs.find({userId})],
    [Posts, Posts.find({userId})],
    [RSSFeeds, RSSFeeds.find({userId})],
    [ReadStatuses, ReadStatuses.find({userId})],
    [Reports, Reports.find({userId})],
    [Revisions, Revisions.find({userId})],
    [Sequences, Sequences.find({userId})],
    [Subscriptions, Subscriptions.find({userId})],
    [TagRels, TagRels.find({userId})],
    [Tags, Tags.find({userId})],
    [UserMostValuablePosts, UserMostValuablePosts.find({userId})],
    [UserTagRels, UserTagRels.find({userId})],
    [Votes, Votes.find({userId})],
  ];

  const values = await Promise.all(entries.map(async ([collection, {fetch}]) =>
    accessFilterMultiple(user, collection, await fetch(), null),
  ));
  const result = Object.fromEntries(entries
    .map(([collection, _], i) => [collection.collectionName, values[i]])
    .filter(([_, records]) => records.length > 0)
  );

  const stringified = JSON.stringify(result, null, 2);

  // eslint-disable-next-line no-console
  console.log("Exported user data:", stringified);

  if (outfile) {
    await writeFile(outfile, stringified);
  }

  return result;
}

