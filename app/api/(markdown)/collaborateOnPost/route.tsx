import { NextRequest } from "next/server";
import {
  renderLiveEditorDraftMarkdownRoute,
} from "../editorMarkdownUtils";

export async function GET(req: NextRequest) {
  return renderLiveEditorDraftMarkdownRoute({
    req,
    mode: "collaborate",
  });
}
