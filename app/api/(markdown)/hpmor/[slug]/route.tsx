import { NextRequest } from "next/server";
import { renderCollectionPostMarkdownBySlug } from "../../collections/collectionPostMarkdownUtils";

const HPMOR_COLLECTION_DOCUMENT_ID = "ywQvGBSojSQZTMpLh";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return await renderCollectionPostMarkdownBySlug(req, slug, {
    documentId: HPMOR_COLLECTION_DOCUMENT_ID,
    htmlPrefix: "/hpmor",
    markdownPrefix: "/api/hpmor",
  });
}
