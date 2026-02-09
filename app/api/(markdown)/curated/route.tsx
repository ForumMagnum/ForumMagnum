import { NextRequest } from "next/server";
import { renderPostsListResponse } from "../postsListUtils";

export async function GET(req: NextRequest) {
  return await renderPostsListResponse(req, {
    title: "Curated Posts",
    selector: { curated: {} },
  });
}
