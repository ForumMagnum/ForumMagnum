// EXPERIMENT (experiment/iframe-layout-ronny-exp3): the AI Futures post as Experiment 3's editor starts it
// (Experiment 2's version, with its fixed-width widget), for the Post tab before any edits.
import { NextResponse } from "next/server";
import { buildWidgetDragDemoHtml } from "@/server/layoutDemo/layoutDemoHtml";
import { demoFingerprint } from "@/components/posts/PostsPage/widgetDragEdits";

export function GET() {
  const html = buildWidgetDragDemoHtml();
  return NextResponse.json({ base: demoFingerprint(html), html });
}
