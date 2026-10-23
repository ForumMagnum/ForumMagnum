// EXPERIMENT (branch experiment/scrollytelling-ronny): creates a local dev-db draft that
// reproduces the AI 2027 scrollytelling layout, for trying out ScrollyIframeWidget.
// Usage:
//   SKIP_VERCEL_CODE_PULL=true yarn repl dev lw packages/lesswrong/scripts/scrollyExperimentDraft.ts "findScrollyUsers()"
//   SKIP_VERCEL_CODE_PULL=true yarn repl dev lw packages/lesswrong/scripts/scrollyExperimentDraft.ts "createScrollyDraft('<userId>', '<contentDir>')"
import fs from "fs";
import path from "path";
import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import Users from "@/server/collections/users/collection";
import { createPost } from "@/server/collections/posts/mutations";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

/** Read-only: candidate accounts for Ronny in the dev db. */
export async function findScrollyUsers() {
  const db = getSqlClientOrThrow();
  /* eslint-disable no-console */
  const rows = await db.any(`
    -- scrollyExperimentDraft.findScrollyUsers
    SELECT _id, slug, "displayName", email, "isAdmin", "lastNotificationsCheck"
    FROM "Users"
    WHERE email ILIKE ANY(ARRAY['ronny@lightconeinfrastructure.com', 'bayesallday@gmail.com', 'brangus@brangus.io'])
      OR "displayName" ILIKE 'Ronny Fernandez%'
  `);
  console.log(JSON.stringify(rows, null, 2));
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Creates the draft: intro, the AI 2027 dashboard as a scrolly widget, then the essay through the race ending. */
export async function createScrollyDraft(userId: string, contentDir: string) {
  const user = await Users.findOne({ _id: userId });
  if (!user) throw new Error(`No user ${userId}`);
  const read = (name: string) => fs.readFileSync(path.join(contentDir, name), "utf-8");

  const widget = `<iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="${escapeAttribute(read("out/ai2027-widget.html"))}"></iframe>`;
  const html = [
    `<p><em>Local scrollytelling experiment. The text below is AI 2027 (main narrative plus the race ending).
      The dashboard is the original AI 2027 HUD, running as an ordinary LessWrong widget; it follows whichever
      section you are reading. Use the switcher in the bottom-left corner to compare layouts.</em></p>`,
    widget,
    read("main.html"),
    read("race.html"),
  ].join("\n");

  const context = await computeContextFromUser({ user, isSSR: false });
  const post = await createPost({
    data: {
      userId,
      title: "AI 2027 (scrollytelling experiment)",
      draft: true,
      contents: { originalContents: { type: "html", data: html } },
    },
  }, context);
  console.log(`Created draft ${post._id}: http://localhost:3000/posts/${post._id}/${post.slug}`);
  return post._id;
}

/** Read-only: writes a stored widget's srcdoc to a file, for debugging what the save pipeline did to it. */
export async function dumpWidgetSrcdoc(widgetId: string, outPath: string) {
  const db = getSqlClientOrThrow();
  const row = await db.one(`
    -- scrollyExperimentDraft.dumpWidgetSrcdoc
    SELECT html FROM "IframeWidgetSrcdocs" WHERE _id = $(widgetId)
  `, { widgetId });
  fs.writeFileSync(outPath, row.html);
  console.log(`Wrote ${row.html.length} chars to ${outPath}`);
}

/** Swaps the stored HTML of one widget on the experiment draft, bypassing the editor save path. */
export async function replaceWidgetSrcdoc(widgetId: string, htmlPath: string) {
  const db = getSqlClientOrThrow();
  const html = fs.readFileSync(htmlPath, "utf-8");
  await db.none(`
    -- scrollyExperimentDraft.replaceWidgetSrcdoc
    UPDATE "IframeWidgetSrcdocs" SET html = $(html) WHERE _id = $(widgetId)
  `, { widgetId, html });
  console.log(`Replaced ${widgetId} with ${html.length} chars`);
}
