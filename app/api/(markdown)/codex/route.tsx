import { NextRequest } from "next/server";
import { renderCollectionMarkdown } from "../collections/collectionMarkdownUtils";

const CODEX_COLLECTION_DOCUMENT_ID = "2izXHCrmJ684AnZ5X";

export async function GET(req: NextRequest) {
  return await renderCollectionMarkdown(req, {
    routeTitle: "The Codex",
    routePath: "/codex",
    documentId: CODEX_COLLECTION_DOCUMENT_ID,
  });
}
