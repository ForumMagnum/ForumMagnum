import { getWithLoader } from "@/lib/loaders";

export type GoogleDocMetadata = {
  id: string;
  name: string;
  version: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
}

/**
 * Returns the "latest" revision of a post (excluding unpublished draft
 * autosaves).
 */
export const getLatestContentsRevision = async <T extends { contents_latest: string | null }>(
  document: T,
  context: ResolverContext,
): Promise<DbRevision | null> => {
  const { Revisions } = context;

  if (!document.contents_latest) {
    return null;
  }
  if (context) {
    const revisions = await getWithLoader(
      context,
      Revisions,
      "documentLatestRevision",
      {},
      "_id",
      document.contents_latest,
    );
    return revisions[0] ?? null;
  }
  return Revisions.findOne({_id: document.contents_latest});
}
