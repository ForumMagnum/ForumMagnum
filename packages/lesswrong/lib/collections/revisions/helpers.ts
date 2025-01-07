import Revisions from "./collection";
import { getWithLoader } from "../../loaders";

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
export const getLatestContentsRevision = async (
  post: DbPost,
  context?: ResolverContext,
): Promise<DbRevision | null> => {
  if (!post.contents_latest) {
    return null;
  }
  if (context) {
    const revisions = await getWithLoader(
      context,
      Revisions,
      "postLatestRevision",
      {},
      "_id",
      post.contents_latest,
    );
    return revisions[0] ?? null;
  }
  return Revisions.findOne({_id: post.contents_latest});
}
