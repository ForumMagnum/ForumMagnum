// EXPERIMENT (experiment/iframe-layout-ronny-exp2): Experiment 2's post as the editor starts it, for the
// Post tab before any edits (and to tell whether stored edits were made to this version of it).
import { NextResponse } from "next/server";
import { buildWidgetDragDemoHtml } from "@/server/layoutDemo/layoutDemoHtml";
import { demoFingerprint } from "@/components/posts/PostsPage/widgetDragEdits";

export function GET() {
  const html = buildWidgetDragDemoHtml();
  return NextResponse.json({ base: demoFingerprint(html), html });
}
