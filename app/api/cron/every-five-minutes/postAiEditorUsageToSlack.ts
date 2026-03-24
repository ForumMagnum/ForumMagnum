import { getAnalyticsConnection } from '@/server/analytics/postgresConnection';
import { createAnonymousContext } from '@/server/vulcan-lib/createContexts';
import { postMessage } from '@/server/slack/client';
import { captureException } from '@/lib/sentryWrapper';
import { isDevelopment } from '@/lib/executionEnvironment';
import { environmentDescriptionSetting } from '@/lib/instanceSettings';

interface RawAnalyticsRow {
  event_type: string;
  event: Record<string, unknown>;
}

async function getUserDisplayNames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const context = createAnonymousContext();
  const users = await context.Users.find(
    { _id: { $in: userIds } },
    { projection: { _id: 1, displayName: 1 } },
  ).fetch();
  return new Map(users.map(u => [u._id, u.displayName]));
}

// Known "happy path" operation results that don't need to be called out in the digest
const HAPPY_RESULTS = new Set(["inserted", "replaced", "deleted", "attached_by_quote_match"]);

function getOperationResult(event: RawAnalyticsRow): string | null {
  const result = event.event.operationResult;
  if (typeof result !== "string") return null;
  if (HAPPY_RESULTS.has(result)) return null;
  return result;
}

function formatUserActivity(
  userId: string,
  events: RawAnalyticsRow[],
  userNames: Map<string, string>,
): string[] {
  const name = userId === "anonymous"
    ? "Anonymous"
    : (userNames.get(userId) ?? "Unknown user");
  const lines: string[] = [];

  const claudeClicks = events.filter(e => e.event_type === "shareWithClaudeClicked");
  if (claudeClicks.length > 0) {
    const panelCounts = new Map<string, number>();
    for (const click of claudeClicks) {
      const panel = (click.event.panel as string) ?? "unknown";
      panelCounts.set(panel, (panelCounts.get(panel) ?? 0) + 1);
    }
    const panelSummary = [...panelCounts.entries()]
      .map(([panel, count]) => count > 1 ? `${count}× ${panel}` : panel)
      .join(", ");
    lines.push(`• *${name}* clicked "Claude" button (${panelSummary})`);
  }

  const apiCalls = events.filter(e => e.event_type === "agentApiCall");
  if (apiCalls.length === 0) return lines;

  const byAgent = new Map<string, RawAnalyticsRow[]>();
  for (const call of apiCalls) {
    const agent = (call.event.agentName as string) ?? "unknown agent";
    const list = byAgent.get(agent) ?? [];
    list.push(call);
    byAgent.set(agent, list);
  }

  for (const [agentName, agentCalls] of byAgent) {
    const successes = agentCalls.filter(e => e.event.status === "success");
    const failures = agentCalls.filter(e => e.event.status !== "success");

    const routeCounts = new Map<string, number>();
    for (const call of successes) {
      const route = call.event.route as string;
      routeCounts.set(route, (routeCounts.get(route) ?? 0) + 1);
    }
    const routeSummary = [...routeCounts.entries()]
      .map(([route, count]) => `${count} ${route}`)
      .join(", ");

    let line = `• *${name}*: agent "${agentName}" made ${successes.length} edit${successes.length !== 1 ? "s" : ""}`;
    if (routeSummary) line += ` (${routeSummary})`;

    if (failures.length > 0) {
      const failureCounts = new Map<string, number>();
      for (const f of failures) {
        const category = (f.event.errorCategory as string) ?? (f.event.status as string) ?? "unknown";
        failureCounts.set(category, (failureCounts.get(category) ?? 0) + 1);
      }
      const failureSummary = [...failureCounts.entries()]
        .map(([cat, count]) => `${count} ${cat}`)
        .join(", ");
      line += `, ${failures.length} failed (${failureSummary})`;
    }

    // Collect non-happy operation results (e.g. "quote_not_found", "widget_not_found")
    const partialCounts = new Map<string, number>();
    for (const call of successes) {
      const result = getOperationResult(call);
      if (result) partialCounts.set(result, (partialCounts.get(result) ?? 0) + 1);
    }
    if (partialCounts.size > 0) {
      const totalPartial = [...partialCounts.values()].reduce((a, b) => a + b, 0);
      const partialSummary = [...partialCounts.entries()]
        .map(([label, count]) => `${count} ${label}`)
        .join(", ");
      line += `, ${totalPartial} partial (${partialSummary})`;
    }

    lines.push(line);
  }

  return lines;
}

export async function postAiEditorUsageToSlack() {
  const connection = getAnalyticsConnection();
  if (!connection) {
    // eslint-disable-next-line no-console
    console.error('Analytics DB not configured for ai-editor-usage-to-slack cron');
    return;
  }

  const environment = isDevelopment ? "development" : environmentDescriptionSetting.get();

  const events: RawAnalyticsRow[] = await connection.any(`
    SELECT event_type, event
    FROM raw
    WHERE event_type IN ('shareWithClaudeClicked', 'agentApiCall')
      AND timestamp > NOW() - INTERVAL '5 minutes 30 seconds'
      AND environment = $(environment)
    ORDER BY timestamp
    LIMIT 10000
  `, { environment });

  if (events.length === 0) return;

  const userIds = [...new Set(
    events
      .map(e => (e.event.userId as string | undefined))
      .filter((id): id is string => !!id)
  )];
  const userNames = await getUserDisplayNames(userIds);

  const byUser = new Map<string, RawAnalyticsRow[]>();
  for (const event of events) {
    const key = (event.event.userId as string) ?? "anonymous";
    const list = byUser.get(key) ?? [];
    list.push(event);
    byUser.set(key, list);
  }

  const activityLines: string[] = [];
  for (const [userId, userEvents] of byUser) {
    activityLines.push(...formatUserActivity(userId, userEvents, userNames));
  }

  if (activityLines.length === 0) return;

  const message = [
    `:robot_face: *AI Editor Activity (last 5 min)*`,
    ``,
    ...activityLines,
  ].join("\n");

  try {
    await postMessage({
      text: message,
      channelName: "aiEditorUsage",
      options: { mrkdwn: true },
    });
    // eslint-disable-next-line no-console
    console.log(`Posted AI editor usage to Slack: ${events.length} events, ${byUser.size} users`);
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post AI editor usage to Slack:', error);
  }
}
