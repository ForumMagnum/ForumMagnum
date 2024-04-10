import { Bans } from "../lib/collections/bans";
import { ClientIds } from "../lib/collections/clientIds/collection";
import Collections from "../lib/collections/collections/collection";
import Comments from "../lib/collections/comments/collection";
import Conversations from "../lib/collections/conversations/collection";
import Localgroups from "../lib/collections/localgroups/collection";
import Messages from "../lib/collections/messages/collection";
import { ModeratorActions } from "../lib/collections/moderatorActions";
import Notifications from "../lib/collections/notifications/collection";
import { PetrovDayLaunchs } from "../lib/collections/petrovDayLaunchs";
import Posts from "../lib/collections/posts/collection";
import ReadStatuses from "../lib/collections/readStatus/collection";
import Reports from "../lib/collections/reports/collection";
import Revisions from "../lib/collections/revisions/collection";
import RSSFeeds from "../lib/collections/rssfeeds/collection";
import Sequences from "../lib/collections/sequences/collection";
import { Subscriptions } from "../lib/collections/subscriptions";
import TagRels from "../lib/collections/tagRels/collection";
import Tags from "../lib/collections/tags/collection";
import UserMostValuablePosts from "../lib/collections/userMostValuablePosts/collection";
import Users from "../lib/collections/users/collection";
import UserTagRels from "../lib/collections/userTagRels/collection";
import { Votes } from "../lib/collections/votes";
import { accessFilterMultiple } from "../lib/utils/schemaUtils";
import { writeFile } from "fs/promises";
import { Globals } from "./vulcan-lib";

type Entry<N extends CollectionNameString> = [
  CollectionBase<N>,
  {fetch: () => Promise<ObjectsByCollectionName[N][]>},
];

/** Please ensure that we know that the user is who they say they are! */
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

  const entries: Entry<CollectionNameString>[] = [
    [Users, {fetch: () => Promise.resolve([user])}],
    [Bans, Bans.find({userId})],
    [ClientIds, ClientIds.find({userIds: userId})],
    [Collections, Collections.find({userId})],
    [Comments, Comments.find({userId})],
    [Conversations, Conversations.find({participantIds: userId})],
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

Globals.exportUserData = exportUserData;
