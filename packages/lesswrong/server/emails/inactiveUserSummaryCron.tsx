import React from "react";
import { hasInactiveSummaryEmail } from "@/lib/betas"
import { generateEmail, wrapAndSendEmail } from "./renderEmail";
import { fetchFragment } from "../fetchFragment";
import {
  type BestReaction,
  EmailInactiveUserSummary,
} from "../emailComponents/EmailInactiveUserSummary";
import { EmailWrapper } from "../emailComponents/EmailWrapper";
import FeatureStrategy from "../recommendations/FeatureStrategy";
import Notifications from "../collections/notifications/collection";
import Users from "../collections/users/collection";
import UsersRepo from "../repos/UsersRepo";
import VotesRepo from "../repos/VotesRepo";
import PostsRepo from "../repos/PostsRepo";
import sum from "lodash/sum";

const chooseBestReaction = (
  reactions: Record<string, number>,
): BestReaction | undefined => {
  const entries = Object.entries(reactions);
  const maxEntry = entries.reduce(
    (max, entry) => entry[1] > max[1] ? entry : max,
    entries[0],
  );
  return maxEntry ? {name: maxEntry[0], count: maxEntry[1]} : undefined;
}

const sendInactiveUserSummaryEmail = async (
  {fetchActivitySince, ...user}: DbUser & {fetchActivitySince: Date},
  dryRun = false,
) => {
  if (!hasInactiveSummaryEmail || !user.email) {
    return;
  }

  const now = new Date();
  const votesRepo = new VotesRepo();
  const postsRepo = new PostsRepo();
  const featureStrategy = new FeatureStrategy();

  const [
    karmaChanges,
    reacts,
    agreements,
    mostCommentedPost,
    unreadNotifications,
    recommendations,
  ] = await Promise.all([
    votesRepo.getEAKarmaChanges({
      userId: user._id,
      startDate: fetchActivitySince,
      endDate: now,
      showNegative: true,
    }),
    votesRepo.getEAReactsReceived(user._id, fetchActivitySince, now),
    votesRepo.getEAAgreements(user._id, fetchActivitySince, now),
    postsRepo.getUsersMostCommentedPostSince(user._id, fetchActivitySince),
    Notifications.find({
      userId: user._id,
      createdAt: {$gt: fetchActivitySince},
      viewed: false,
      emailed: false,
      deleted: false,
    }).count(),
    featureStrategy.recommend(user, 5, {
      name: "feature",
      postId: "",
      features: [
        {feature: "curated", weight: 1},
        {feature: "karma", weight: 0.1},
      ],
    }, {
      publishedAfter: fetchActivitySince,
    }),
  ]);

  const recommendedPosts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsList",
    currentUser: user,
    selector: {
      _id: {$in: recommendations.posts.map((post) => post._id)},
    },
  });

  const karmaChange = sum(karmaChanges.map(({scoreChange}) => scoreChange));
  const reactions = {...reacts, ...agreements};
  const bestReaction = chooseBestReaction(reactions);

  const from = "EA Forum Team <eaforum@centreforeffectivealtruism.org>";
  const subject = "See what you’ve missed on the Forum";
  const tag = "inactive-user-summary";
  const utmParams = {
    utm_source: "inactive_user_summary",
    utm_user_id: user._id,
  };
  const body = (
    <EmailInactiveUserSummary
      user={user}
      karmaChange={karmaChange}
      bestReaction={bestReaction}
      mostCommentedPost={mostCommentedPost ?? undefined}
      unreadNotifications={unreadNotifications}
      recommendedPosts={recommendedPosts}
    />
  );

  if (dryRun) {
    const email = await generateEmail({
      user,
      from,
      to: user.email,
      subject,
      bodyComponent: (
        <EmailWrapper unsubscribeAllLink="#" centerFooter>
          {body}
        </EmailWrapper>
      ),
      utmParams,
      tag,
    });
    // eslint-disable-next-line no-console
    console.log("Generated dry-run email HTML:", email.html);
  } else {
    await wrapAndSendEmail({
      user,
      from,
      subject,
      body,
      utmParams,
      tag,
      centerFooter: true,
    });
    await Users.rawUpdateOne(
      {_id: user._id},
      {$set: {inactiveSummaryEmailSentAt: now}},
    );
  }
}

export const sendInactiveUserSummaryEmails = async (
  limit = 10,
  dryRun = false,
) => {
  if (!hasInactiveSummaryEmail) {
    return;
  }

  const users = await new UsersRepo().getUsersForInactiveSummaryEmail(limit);
  for (const user of users) {
    try {
      // await one at a time to avoid blasting the DB
      await sendInactiveUserSummaryEmail(user, dryRun);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `Error sending inactive user summary email to ${user._id}`,
        err,
      );
    }
  }
}
