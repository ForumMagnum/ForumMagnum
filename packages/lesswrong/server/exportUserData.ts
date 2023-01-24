import { Bans } from "../lib/collections/bans";
import { ClientIds } from "../lib/collections/clientIds/collection";
import Collections from "../lib/collections/collections/collection";
import Comments from "../lib/collections/comments/collection";
import Conversations from "../lib/collections/conversations/collection";
import EmailTokens from "../lib/collections/emailTokens/collection";
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
import { Globals } from "./vulcan-lib";
import { writeFile } from "fs/promises";

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

  const entries: [string, any][] = [
    ["user", user],
    ["bans", Bans.find({userId}).fetch()],
    ["clientIds", ClientIds.find({userIds: userId}).fetch()],
    ["collections", Collections.find({userId}).fetch()],
    ["comments", Comments.find({userId}).fetch()],
    ["conversations", Conversations.find({participantIds: userId}).fetch()],
    ["emailTokens", EmailTokens.find({userId}).fetch()],
    ["localGroups", Localgroups.find({organizerIds: userId}).fetch()],
    ["messages", Messages.find({userId}).fetch()],
    ["moderatorActions", ModeratorActions.find({userId}).fetch()],
    ["notifications", Notifications.find({userId}).fetch()],
    ["pretrovDayLaunches", PetrovDayLaunchs.find({userId}).fetch()],
    ["posts", Posts.find({userId}).fetch()],
    ["rssFeeds", RSSFeeds.find({userId}).fetch()],
    ["readStatuses", ReadStatuses.find({userId}).fetch()],
    ["reports", Reports.find({userId}).fetch()],
    ["revisions", Revisions.find({userId}).fetch()],
    ["sequences", Sequences.find({userId}).fetch()],
    ["subscriptions", Subscriptions.find({userId}).fetch()],
    ["tagRels", TagRels.find({userId}).fetch()],
    ["tags", Tags.find({userId}).fetch()],
    ["userMostValuablePosts", UserMostValuablePosts.find({userId}).fetch()],
    ["userTagRels", UserTagRels.find({userId}).fetch()],
    ["votes", Votes.find({userId}).fetch()],
  ];

  const values = await Promise.all(entries.map(([_, value]) => value));
  const result = Object.fromEntries(entries.map(([name, _], i) => [name, values[i]]));

  const stringified = JSON.stringify(result, null, 2);

  // eslint-disable-next-line no-console
  console.log("Exported user data:", stringified);

  if (outfile) {
    await writeFile(outfile, stringified);
  }

  return result;
}

Globals.exportUserData = exportUserData;
