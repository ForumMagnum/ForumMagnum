import { WebClient, KnownBlock, Block } from "@slack/web-api";

const slackChannels = {
  agentFeedback: "AGENT_FEEDBACK_SLACK_CHANNEL_ID",
  aiEditorUsage: "AI_EDITOR_USAGE_CHANNEL_ID",
  curation: "CURATION_SLACK_CHANNEL_ID",
  moderation: "MODERATION_CHANNEL_ID",
} as const;

type SlackChannelName = keyof typeof slackChannels;

interface PostMessageOptions {
  mrkdwn?: boolean;
  blocks?: (KnownBlock | Block)[];
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

interface PostMessageArgs {
  text: string;
  channelName: SlackChannelName;
  options?: PostMessageOptions;
}

let cachedClient: WebClient | null = null;

function getSlackClient(): WebClient | null {
  const token = process.env.AMANUENSIS_SLACK_BOT_TOKEN;
  if (!token) return null;
  if (!cachedClient) cachedClient = new WebClient(token);
  return cachedClient;
}

export async function postMessage({ text, channelName, options }: PostMessageArgs) {
  const slack = getSlackClient();
  if (!slack) {
    // eslint-disable-next-line no-console
    console.error("AMANUENSIS_SLACK_BOT_TOKEN is not set");
    return;
  }

  const envVarName = slackChannels[channelName];
  const channelId = process.env[envVarName];
  if (!channelId) {
    // eslint-disable-next-line no-console
    console.error(`${envVarName} is not set`);
    return;
  }

  await slack.chat.postMessage({
    channel: channelId,
    text,
    blocks: options?.blocks,
    mrkdwn: options?.mrkdwn,
    unfurl_links: options?.unfurl_links,
    unfurl_media: options?.unfurl_media,
  });
}
