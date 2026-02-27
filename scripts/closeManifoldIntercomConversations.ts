/**
 * Script to close all Intercom conversations from "Manifold" (automated prediction market emails).
 *
 * Usage:
 *   npx tsx scripts/closeManifoldIntercomConversations.ts
 *
 * Add --dry-run to preview without closing:
 *   npx tsx scripts/closeManifoldIntercomConversations.ts --dry-run
 *
 * Reads the intercom token from the private_intercomToken env var (same as the server).
 */

const INTERCOM_API = "https://api.intercom.io";
const TOKEN = "" // look up intercom token in Intercom -> settings -> developer hub
const DRY_RUN = process.argv.includes("--dry-run");
const PER_PAGE = 150;
const CLOSE_DELAY_MS = 200;

if (!TOKEN) {
  console.error("Error: INTERCOM_TOKEN environment variable is not set");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function getFirstAdminId(): Promise<string> {
  const res = await fetch(`${INTERCOM_API}/admins`, { headers });
  if (!res.ok) throw new Error(`Failed to list admins: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const admin = data.admins?.[0];
  if (!admin) throw new Error("No admins found in workspace");
  console.log(`Using admin: ${admin.name} (${admin.id})`);
  return admin.id;
}

interface ConversationSearchResult {
  id: string;
  title?: string;
  state?: string;
  source?: { author?: { name?: string; email?: string } };
}

async function searchManifoldConversations(): Promise<ConversationSearchResult[]> {
  const allConversations: ConversationSearchResult[] = [];
  let startingAfter: string | null = null;
  let page = 1;

  while (true) {
    const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
    const body: Record<string, unknown> = {
      query: {
        operator: "AND",
        value: [
          { field: "source.author.name", operator: "=", value: "Manifold" },
          { field: "source.subject", operator: "=", value: "Your market has closed" },
          { field: "created_at", operator: ">", value: sixtyDaysAgo },
        ],
      },
      pagination: { per_page: PER_PAGE, ...(startingAfter ? { starting_after: startingAfter } : {}) },
    };

    const res = await fetch(`${INTERCOM_API}/conversations/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Search failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    const conversations: ConversationSearchResult[] = data.conversations ?? [];
    allConversations.push(...conversations);

    const totalPages = data.pages?.total_pages ?? 1;
    console.log(`Fetched page ${page}/${totalPages} (${conversations.length} conversations, ${allConversations.length} total)`);

    const nextCursor = data.pages?.next?.starting_after;
    if (!nextCursor || page >= totalPages) break;
    startingAfter = nextCursor;
    page++;
  }

  return allConversations;
}

async function closeConversation(conversationId: string, adminId: string): Promise<boolean> {
  const res = await fetch(`${INTERCOM_API}/conversations/${conversationId}/parts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message_type: "close",
      type: "admin",
      admin_id: adminId,
    }),
  });
  return res.ok;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN MODE ===" : "=== CLOSING MANIFOLD CONVERSATIONS ===");

  const adminId = await getFirstAdminId();
  const conversations = await searchManifoldConversations();

  const openConversations = conversations.filter((c) => c.state === "open");
  console.log(`\nFound ${conversations.length} total Manifold conversations, ${openConversations.length} are open`);

  if (openConversations.length === 0) {
    console.log("Nothing to close.");
    return;
  }

  if (DRY_RUN) {
    console.log("\nWould close these conversations:");
    for (const c of openConversations) {
      console.log(`  - ${c.id}: ${c.source?.author?.name} | ${c.title ?? "(no title)"}`);
    }
    console.log(`\nRun without --dry-run to close ${openConversations.length} conversations.`);
    return;
  }

  let closed = 0;
  let failed = 0;
  for (const c of openConversations) {
    const ok = await closeConversation(c.id, adminId);
    if (ok) {
      closed++;
      if (closed % 50 === 0) console.log(`  Closed ${closed}/${openConversations.length}...`);
    } else {
      failed++;
      console.error(`  Failed to close conversation ${c.id}`);
    }
    await new Promise((r) => setTimeout(r, CLOSE_DELAY_MS));
  }

  console.log(`\nDone! Closed: ${closed}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
