import { NextRequest } from "next/server";
import { renderCollectionPostMarkdownBySlug } from "../../collections/collectionPostMarkdownUtils";

const CODEX_COLLECTION_DOCUMENT_ID = "2izXHCrmJ684AnZ5X";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return await renderCollectionPostMarkdownBySlug(req, slug, {
    documentId: CODEX_COLLECTION_DOCUMENT_ID,
    htmlPrefix: "/codex",
    markdownPrefix: "/api/codex",
  });
}
