import { newUserGuideId } from "@/lib/instanceSettings";
import { NextRequest } from "next/server";
import { renderPostMarkdownByIdOrSlug } from "../post/postMarkdownUtils";

export async function GET(req: NextRequest) {
  return await renderPostMarkdownByIdOrSlug(req, newUserGuideId.get());
}

