import { Bans } from "../lib/collections/bans/collection";
import { ClientIds } from "../lib/collections/clientIds/collection";
import Collections from "../lib/collections/collections/collection";
import Comments from "../lib/collections/comments/collection";
import Conversations from "../lib/collections/conversations/collection";
import Localgroups from "../lib/collections/localgroups/collection";
import Messages from "../lib/collections/messages/collection";
import { ModeratorActions } from "../lib/collections/moderatorActions/collection";
import Notifications from "../lib/collections/notifications/collection";
import { PetrovDayLaunchs } from "../lib/collections/petrovDayLaunchs/collection";
import Posts from "../lib/collections/posts/collection";
import ReadStatuses from "../lib/collections/readStatus/collection";
import Reports from "../lib/collections/reports/collection";
import Revisions from "../lib/collections/revisions/collection";
import RSSFeeds from "../lib/collections/rssfeeds/collection";
import Sequences from "../lib/collections/sequences/collection";
import { Subscriptions } from "../lib/collections/subscriptions/collection";
import TagRels from "../lib/collections/tagRels/collection";
import Tags from "../lib/collections/tags/collection";
import UserMostValuablePosts from "../lib/collections/userMostValuablePosts/collection";
import Users from "../lib/collections/users/collection";
import UserTagRels from "../lib/collections/userTagRels/collection";
import { Votes } from "../lib/collections/votes/collection";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { writeFile } from "fs/promises";
import CkEditorUserSessions from "@/lib/collections/ckEditorUserSessions/collection";
import CurationEmails from "@/lib/collections/curationEmails/collection";
import DialogueChecks from "@/lib/collections/dialogueChecks/collection";
import ElectionVotes from "@/lib/collections/electionVotes/collection";
import ElicitQuestionPredictions from "@/lib/collections/elicitQuestionPredictions/collection";
import GardenCodes from "@/lib/collections/gardencodes/collection";
import GoogleServiceAccountSessions from "@/lib/collections/googleServiceAccountSessions/collection";
import { LWEvents } from "@/lib/collections/lwevents/collection.ts";
import PostRecommendations from "@/lib/collections/postRecommendations/collection";
import RecommendationsCaches from "@/lib/collections/recommendationsCaches/collection";
import ReviewVotes from "@/lib/collections/reviewVotes/collection";
import TypingIndicators from "@/lib/collections/typingIndicators/collection";
import UserEAGDetails from "@/lib/collections/userEAGDetails/collection";
import UserJobAds from "@/lib/collections/userJobAds/collection";
import { UserRateLimits } from "@/lib/collections/userRateLimits/collection.ts";

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

