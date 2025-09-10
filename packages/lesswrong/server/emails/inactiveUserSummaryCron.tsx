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
import Users from "../collections/users/collection";
import UsersRepo from "../repos/UsersRepo";
import VotesRepo from "../repos/VotesRepo";
import PostsRepo from "../repos/PostsRepo";
import sum from "lodash/sum";
import orderBy from "lodash/orderBy";
import { addCronJob } from "../cron/cronUtil";

const chooseBestReaction = (
  reactions: Record<string, number>,
): BestReaction | undefined => {
  const entries = Object.entries(reactions);
  const maxEntry = entries.reduce(
    (max, entry) => entry[1] > max[1] ? entry : max,
    entries[0],
  );
  return maxEntry?.[1] ? {name: maxEntry[0], count: maxEntry[1]} : undefined;
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
    recommendations,
  ] = await Promise.all([
    votesRepo.getEAKarmaChanges({
      userId: user._id,
      startDate: fetchActivitySince,
      endDate: now,
    }),
    votesRepo.getEAReactsReceived(user._id, fetchActivitySince, now),
    votesRepo.getEAAgreements(user._id, fetchActivitySince, now),
    postsRepo.getUsersMostCommentedPostSince(user._id, fetchActivitySince),
    featureStrategy.recommend(user, 5, {
      name: "feature",
      postId: "",
      features: [
        {feature: "frontpageFilterSettings", weight: 1},
        {feature: "subscribedAuthorPosts", weight: 1},
        {feature: "subscribedTagPosts", weight: 0.9},
        {feature: "curated", weight: 0.75},
        {feature: "karma", weight: 0.4},
      ],
    }, {
      publishedAfter: fetchActivitySince,
    }),
  ]);
  const recommendedPostIds = recommendations.posts.map((post) => post._id);
  const recommendedPosts = await fetchFragment({
    collectionName: "Posts",
    fragmentName: "PostsList",
    currentUser: user,
    selector: {
      _id: {$in: recommendedPostIds},
    },
  });
  const orderedRecommendedPosts = orderBy(
    recommendedPosts,
    [(post) => recommendedPostIds.indexOf(post._id)],
    ['asc']
  );

  const karmaChange = sum(karmaChanges.map(({scoreChange}) => scoreChange));
  const reactions = {...reacts, ...agreements};
  const bestReaction = chooseBestReaction(reactions);

  const from = "EA Forum Team <eaforum@centreforeffectivealtruism.org>";
  const subject = "See what you’ve missed on the Forum";
  const tag = "inactive-user-summary";
  const utmParams = {
    utm_source: "inactive_user_summary",
    utm_medium: "email",
    utm_user_id: user._id,
  };
  const body = (
    <EmailInactiveUserSummary
      user={user}
      karmaChange={karmaChange}
      bestReaction={bestReaction}
      mostCommentedPost={mostCommentedPost ?? undefined}
      recommendedPosts={orderedRecommendedPosts}
    />
  );

  if (dryRun) {
    const email = await generateEmail({
      user,
      from,
      to: user.email,
      subject,
      bodyComponent: (
        <EmailWrapper unsubscribeAllLink="#">
          {body}
        </EmailWrapper>
      ),
      includeCustomFonts: true,
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
      includeCustomFonts: true,
      tag,
    });
    await Users.rawUpdateOne(
      {_id: user._id},
      {$set: {inactiveSummaryEmailSentAt: now}},
    );
  }
}

export const sendInactiveUserSummaryEmails = async (
  limit = 60,
  dryRun = false,
) => {
  if (!hasInactiveSummaryEmail) {
    return {skipReason: "inactiveSummaryEmailDisabled", limit, dryRun};
  }

  const results: unknown[] = [];
  const users = await new UsersRepo().getUsersForInactiveSummaryEmail(limit);
  for (const user of users) {
    try {
      // await one at a time to avoid blasting the DB
      await sendInactiveUserSummaryEmail(user, dryRun);
      results.push(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(
        `Error sending inactive user summary email to ${user._id}`,
        err,
      );
      results.push(err);
    }
  }

  return {
    users: users.map((user) => user._id),
    results: results.map(
      (result) => result === null
        ? result
        : result instanceof Error
          ? result.message
          : String(result),
    ),
    limit,
    dryRun,
  };
}

export const sendInactiveUserSummaryEmailsCron = addCronJob({
  name: "sendInactiveUserSummaryEmails",
  interval: "every 1 day",
  disabled: !hasInactiveSummaryEmail,
  job: () => sendInactiveUserSummaryEmails(),
});
