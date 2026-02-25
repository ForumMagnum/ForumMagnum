import { NextRequest } from "next/server";
import { renderCollectionMarkdown } from "../collections/collectionMarkdownUtils";

const HPMOR_COLLECTION_DOCUMENT_ID = "ywQvGBSojSQZTMpLh";

export async function GET(req: NextRequest) {
  return await renderCollectionMarkdown(req, {
    routeTitle: "Harry Potter and the Methods of Rationality",
    routePath: "/hpmor",
    documentId: HPMOR_COLLECTION_DOCUMENT_ID,
  });
}
