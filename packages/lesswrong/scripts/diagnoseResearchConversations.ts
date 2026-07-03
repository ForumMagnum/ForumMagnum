import ResearchConversations from "@/server/collections/researchConversations/collection";
import ResearchConversationEvents from "@/server/collections/researchConversationEvents/collection";
import ResearchSandboxSessions from "@/server/collections/researchSandboxSessions/collection";

/**
 * Read-only diagnostic: recent conversations, their event pipelines, and
 * sandbox sessions — to see where a turn stopped (dispatch, spawn, events).
 * yarn repl prod lw packages/lesswrong/scripts/diagnoseResearchConversations.ts "diagnoseResearchConversations(6)"
 */
export async function diagnoseResearchConversations(hoursBack = 6) {
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const convs = await ResearchConversations.find(
    { createdAt: { $gt: since } },
    { sort: { createdAt: -1 }, limit: 10 },
  ).fetch();
  // eslint-disable-next-line no-console
  console.log(`${convs.length} conversations created in last ${hoursBack}h`);
  for (const conv of convs) {
    const events = await ResearchConversationEvents.find(
      { conversationId: conv._id },
      { sort: { seq: 1 } },
    ).fetch();
    const session = await ResearchSandboxSessions.findOne({ conversationId: conv._id });
    const kinds = events.map((e) => {
      const p = e.payload as Record<string, unknown> | null;
      const subtype = p && typeof p.subtype === "string" ? `:${p.subtype}` : "";
      return `${e.seq}:${e.kind}${subtype}`;
    });
    // eslint-disable-next-line no-console
    console.log(`\n=== ${conv._id} created=${conv.createdAt?.toISOString()} title=${JSON.stringify(conv.title)}`);
    // eslint-disable-next-line no-console
    console.log(`  session=${session ? "yes" : "NO"} events=${events.length}: ${kinds.join(" | ").slice(0, 600)}`);
    const last = events[events.length - 1];
    if (last) {
      // eslint-disable-next-line no-console
      console.log(`  last payload: ${JSON.stringify(last.payload).slice(0, 500)}`);
    }
  }
}
