import { isEAForum } from "@/lib/instanceSettings";
import { addCronJob } from "./cronUtil";
import TweetsRepo from "./repos/TweetsRepo";
import { DatabaseServerSetting } from "./databaseSettings";
import { loggerConstructor } from "@/lib/utils/logging";
import { Posts } from "@/lib/collections/posts";
import Tweets from "@/lib/collections/tweets/collection";
import { createMutator } from "./vulcan-lib";
import { TwitterApi } from 'twitter-api-v2';
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import Users from "@/lib/vulcan-users";
import { dogstatsd } from "./datadog/tracer";

const enabledSetting = new DatabaseServerSetting<boolean>("twitterBot.enabled", false);
const karmaThresholdSetting = new DatabaseServerSetting<number>("twitterBot.karmaTreshold", 40);
const apiKeySetting = new DatabaseServerSetting<string | null>("twitterBot.apiKey", null);
const apiKeySecretSetting = new DatabaseServerSetting<string | null>("twitterBot.apiKeySecret", null);
const accessTokenSetting = new DatabaseServerSetting<string | null>("twitterBot.accessToken", null);
const accessTokenSecretSetting = new DatabaseServerSetting<string | null>("twitterBot.accessTokenSecret", null);

const TWEET_MAX_LENGTH = 279;
const URL_LENGTH = 24;

async function writeTweet(post: DbPost): Promise<string> {
  const userIds = [
    post.userId,
    ...(post.coauthorStatuses ?? []).map(({ userId }) => userId)
  ];

  const users = await Users.find(
    { _id: { $in: userIds }, deleted: false }
  ).fetch();

  const usersOrdered = userIds.map(id => 
    users.find(user => user._id === id)
  ).filter(user => user) as DbUser[];
  const userDisplayNames = usersOrdered.map(user => user.displayName);

  let authorString;
  switch (userDisplayNames.length) {
    case 1:
      authorString = userDisplayNames[0];
      break;
    case 2:
      authorString = `${userDisplayNames[0]} and ${userDisplayNames[1]}`;
      break;
    default:
      authorString = `${userDisplayNames[0]} + ${userDisplayNames.length - 1} others`;
      break;
  }

  const preUrlPart = `New popular post from the EA Forum:\n\n"${post.title}" by ${authorString}`;
  const truncatedPreUrlPart = preUrlPart.length + URL_LENGTH > TWEET_MAX_LENGTH
    ? preUrlPart.substring(0, TWEET_MAX_LENGTH - URL_LENGTH - 3) + "..."
    : preUrlPart;

  return `${truncatedPreUrlPart}\n${postGetPageUrl(post, true)}`;
}

async function postTweet(content: string) {
  const apiKey = apiKeySetting.get()
  const apiKeySecret = apiKeySecretSetting.get()
  const accessToken = accessTokenSetting.get()
  const accessTokenSecret = accessTokenSecretSetting.get()

  try {
    if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
      throw new Error("Twitter bot credentials not configured")
    }

    const twitterClient = new TwitterApi({
      appKey: apiKey,
      appSecret: apiKeySecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
    const rwClient = twitterClient.readWrite

    const { data } = await rwClient.v2.tweet(content);
    dogstatsd?.increment("tweet_created", 1, 1.0, {outcome: 'success'})
    return data.id
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error posting tweet. Tweet content: ${content}, error:`, error);
    dogstatsd?.increment("tweet_created", 1, 1.0, {outcome: 'error'})
  }
}

addCronJob({
  name: "runTwitterBot",
  interval: "every 31 minutes",
  job: async () => {
    if (!enabledSetting.get()) return;

    const repo = new TweetsRepo();
    const logger = loggerConstructor("twitter-bot");

    // Get posts that have crossed `twitterBotKarmaThresholdSetting` in the last
    // day, and haven't already been tweeted. Then tweet the top one.
    const since = new Date(Date.now() - (24 * 60 * 60 * 1000));
    const threshold = karmaThresholdSetting.get();

    logger(`Checking for posts newly crossing ${threshold} karma`);
    const postIds = await repo.getUntweetedPostsCrossingKarmaThreshold({ since, threshold });

    if (postIds.length < 1) {
      logger(`No posts found, returning`);
      return;
    }

    const posts = await Posts.find({ _id: { $in: postIds } }, { sort: { baseScore: -1, title: 1 } }).fetch();
    const topPost = posts[0]

    const content = await writeTweet(topPost)
    logger(`Posting tweet with content: ${content}`)
    const tweetId = await postTweet(content)

    if (!tweetId) {
      logger(`Failed to create tweet`)
      return
    }
    logger(`Tweet created, id: ${tweetId}`)

    await createMutator({
      collection: Tweets,
      document: {
        postId: topPost._id,
        content,
        tweetId
      },
      validate: false
    })
  },
});
