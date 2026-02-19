import { NextRequest } from "next/server";
import { renderCollectionPostMarkdownBySlug } from "../../collections/collectionPostMarkdownUtils";

const RATIONALITY_COLLECTION_DOCUMENT_ID = "oneQyj4pw77ynzwAF";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return await renderCollectionPostMarkdownBySlug(req, slug, {
    documentId: RATIONALITY_COLLECTION_DOCUMENT_ID,
    htmlPrefix: "/rationality",
    markdownPrefix: "/api/rationality",
  });
}
