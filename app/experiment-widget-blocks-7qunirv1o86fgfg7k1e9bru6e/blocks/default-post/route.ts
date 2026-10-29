// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the second demo post as its editor starts it, for the
// Post tab before any edits.
import { NextResponse } from "next/server";
import { buildBlocksDemoHtml } from "@/server/layoutDemo/blocksDemoHtml";
import { demoFingerprint } from "@/components/posts/PostsPage/widgetDragEdits";

export function GET() {
  const html = buildBlocksDemoHtml();
  return NextResponse.json({ base: demoFingerprint(html), html });
}
