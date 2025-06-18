import { WebClient } from "@slack/web-api";
import { slackApiTokenSetting, slackModFlagsChannelIdSetting } from "./databaseSettings";
import { fetchFragmentSingle } from "./fetchFragment";
import { createAdminContext } from "./vulcan-lib/createContexts";
import { commentGetPageUrl } from "@/lib/collections/comments/helpers";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";
import { isEAForum } from "@/lib/instanceSettings";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";

const hasModSlackWarnings = isEAForum;

/**
 * Forward a report to a channel in Slack. The generate an API key you must
 * create an app as a Slack admin - this will have an API key beginning with
 * either "xoxa-" or "xoxb-". You can get the channel ID from the channel
 * details window in Slack. Note that you must manually add the new app to the
 * channel otherwise you will get a "channel_not_found" exception when you try
 * to post there.
 * Preview formatted message content at https://app.slack.com/block-kit-builder
 */
export const forwardReportToModSlack = async (reportId: string) => {
  if (!hasModSlackWarnings) {
    return;
  }

  try {
    const context = createAdminContext();
    const report = await fetchFragmentSingle({
      context,
      currentUser: context.currentUser,
      skipFiltering: true,
      collectionName: "Reports",
      fragmentName: "ReportsSlackPreview",
      selector: {_id: reportId},
    });
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    const contentType = report.comment ? "comment" : "post";
    const description = report.description || "[No description]";

    const apiToken = slackApiTokenSetting.get();
    if (!apiToken) {
      throw new Error("Slack API token not configured");
    }

    const modFlagsChannelId = slackModFlagsChannelIdSetting.get();
    if (!modFlagsChannelId) {
      throw new Error("Mod flags channel ID not configured");
    }

    const url = report.comment
      ? commentGetPageUrl(report.comment, true)
      : report.post
        ? postGetPageUrl(report.post, true)
        : getSiteUrl();

    const userName = report.user?.username ?? "[Unknown user]";
    const userLink = userGetProfileUrl(report.user, true);

    const client = new WebClient(apiToken);
    const result = await client.chat.postMessage({
      channel: modFlagsChannelId,
      unfurl_links: false,
      text: `Reported ${contentType}: ${description}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `Reported ${contentType}`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Reported by <${userLink}|${userName}>:* _${description}_`,
          }
        },
        {
          type: "divider",
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: `View ${contentType} on the EA Forum`,
                emoji: true,
              },
              value: `view_${contentType}_on_ea_forum`,
              url,
            },
          ]
        },
      ],
    });
    // eslint-disable-next-line no-console
    console.log(`Successfully sent Slack message: ${result.ts}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to post to mod slack:", err);
  }
}
