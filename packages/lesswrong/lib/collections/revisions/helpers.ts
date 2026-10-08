import { userCanReadField, userOwns, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import type { RevisionOriginalContentsData } from "./revisionSchemaTypes";
import { SharableDocument, userIsSharedOn } from "../users/helpers";
import { userIsPostGroupOrganizer } from "../posts/helpers";

const isSharable = (document: any): document is SharableDocument => {
  return "coauthorUserIds" in document || "shareWithUsers" in document || "sharingSettings" in document;
};

export const getOriginalContents = async <N extends CollectionNameString>(
  currentUser: DbUser | null,
  document: ObjectsByCollectionName[N],
  originalContents: RevisionOriginalContentsData|null,
  context: ResolverContext,
) => {
  const canViewOriginalContents = (user: DbUser | null, doc: DbObject) =>
    isSharable(doc) ? userIsSharedOn(user, doc) : true;

  const userHasReadPermissions = userCanReadField(
    currentUser,
    // We need `userIsPodcaster` here to make it possible for podcasters to open post edit forms to add/update podcast episode info
    // Without it, `originalContents` may resolve to undefined, which causes issues in revisionResolvers
    [userOwns, canViewOriginalContents, userIsPodcaster, "admins", "sunshineRegiment"],
    document
  ) || (await userIsPostGroupOrganizer(currentUser, document as DbPost, context));

  if (userHasReadPermissions && originalContents) {
    return originalContents;
  }

  return {
    type: originalContents?.type ?? 'ckEditorMarkup',
    data: '',
  };
};

interface RevisionWithOriginalContents {
  _id?: string | null,
  originalContentsId?: string | null,
  originalContents?: RevisionOriginalContentsData | null,
}

/**
 * Load editor-format contents for a revision.
 *
 * While the legacy inline `Revisions.originalContents` column exists, it takes
 * precedence over the `RevisionOriginalContents` row. Every writer keeps the
 * inline column current, including code that predates `RevisionOriginalContents`
 * (an older server during a deploy, or after a rollback), which writes only the
 * inline column and so can leave the row stale. The row is used when the inline
 * column is empty.
 *
 * Before the inline column stops being written, rerun the
 * `backfillRevisionOriginalContents` migration (which also brings stale rows up
 * to date). Code that stops writing the column must set it to NULL rather than
 * leave it stale, or this function will prefer the stale inline contents.
 */
export async function getStoredOriginalContentsForRevision(
  revision: RevisionWithOriginalContents,
  context: ResolverContext,
): Promise<RevisionOriginalContentsData | null> {
  if ("originalContents" in revision) {
    return await getOriginalContentsFromRevisionRow(revision, context);
  }
  if (revision._id) {
    // The revision we were given is a partial projection (or a denormalized
    // editable field) without the inline column, so check the stored row
    const storedRevision = await context.loaders.Revisions.load(revision._id);
    return storedRevision ? await getOriginalContentsFromRevisionRow(storedRevision, context) : null;
  }
  return await getOriginalContentsFromRevisionRow(revision, context);
}

async function getOriginalContentsFromRevisionRow(
  revision: RevisionWithOriginalContents,
  context: ResolverContext,
): Promise<RevisionOriginalContentsData | null> {
  if (revision.originalContents) {
    return revision.originalContents;
  }
  if (revision.originalContentsId) {
    const roc = await context.loaders.RevisionOriginalContents.load(revision.originalContentsId);
    return roc?.originalContents ?? null;
  }
  return null;
}

export async function getRevisionOriginalContentsByRevisionId(
  revisionId: string,
  context: ResolverContext,
): Promise<RevisionOriginalContentsData | null> {
  const revision = await context.loaders.Revisions.load(revisionId);
  if (!revision) return null;
  return getStoredOriginalContentsForRevision(revision, context);
}
