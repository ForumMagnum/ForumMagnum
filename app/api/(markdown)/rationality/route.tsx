import { NextRequest } from "next/server";
import { renderCollectionMarkdown } from "../collections/collectionMarkdownUtils";

const RATIONALITY_COLLECTION_DOCUMENT_ID = "oneQyj4pw77ynzwAF";

export async function GET(req: NextRequest) {
  return await renderCollectionMarkdown(req, {
    routeTitle: "Rationality: A-Z",
    routePath: "/rationality",
    documentId: RATIONALITY_COLLECTION_DOCUMENT_ID,
  });
}
