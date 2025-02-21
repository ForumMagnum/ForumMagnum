import { addCronJob } from "./cronUtil";
import TweetsRepo from "./repos/TweetsRepo";
import { loggerConstructor } from "@/lib/utils/logging";
import { Posts } from "@/lib/collections/posts/collection.ts";
import Tweets from "@/lib/collections/tweets/collection";
import { TwitterApi } from 'twitter-api-v2';
import { getConfirmedCoauthorIds, postGetPageUrl } from "@/lib/collections/posts/helpers";
import Users from "@/lib/collections/users/collection";
import { dogstatsd } from "./datadog/tracer";
import { PublicInstanceSetting, twitterBotEnabledSetting, twitterBotKarmaThresholdSetting } from "@/lib/instanceSettings";
import { Globals } from "../lib/vulcan-lib/config";
import { createMutator } from "./vulcan-lib/mutators";

const apiKeySetting = new PublicInstanceSetting<string | null>("twitterBot.apiKey", null, "optional");
const apiKeySecretSetting = new PublicInstanceSetting<string | null>("twitterBot.apiKeySecret", null, "optional");
const accessTokenSetting = new PublicInstanceSetting<string | null>("twitterBot.accessToken", null, "optional");
const accessTokenSecretSetting = new PublicInstanceSetting<string | null>("twitterBot.accessTokenSecret", null, "optional");

const TWEET_MAX_LENGTH = 279;
const URL_LENGTH = 24;

async function writeTweet(post: DbPost): Promise<string> {
  const userIds = [
    post.userId,
    ...getConfirmedCoauthorIds(post)
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

async function runTwitterBot() {
  if (!twitterBotEnabledSetting.get()) return;

  const repo = new TweetsRepo();
  const logger = loggerConstructor("twitter-bot");

  const threshold = twitterBotKarmaThresholdSetting.get();

  logger(`Checking for posts newly crossing ${threshold} karma`);
  const postIds = await repo.getUntweetedPostsCrossingKarmaThreshold({ limit: 20, threshold });

  if (postIds.length < 1) {
    logger(`No posts found, returning`);
    return;
  }

  const posts = await Posts.find({ _id: { $in: postIds } }, { sort: { postedAt: 1, title: 1 } }).fetch();

  for (const post of posts) {
    const content = await writeTweet(post);
    logger(`Attempting to post tweet with content: ${content}`);
    const tweetId = await postTweet(content);

    if (tweetId) {
      logger(`Tweet created, id: ${tweetId}`);
      await createMutator({
        collection: Tweets,
        document: {
          postId: post._id,
          content,
          tweetId
        },
        validate: false
      });
      return;
    } else {
      logger(`Failed to create tweet for post with id: ${post._id}, trying next post`);
    }
  }

  logger(`All attempts failed, no tweets created.`);
}

addCronJob({
  name: "runTwitterBot",
  interval: "every 31 minutes",
  job: async () => {
    await runTwitterBot();
  },
});

Globals.runTwitterBot = runTwitterBot;
