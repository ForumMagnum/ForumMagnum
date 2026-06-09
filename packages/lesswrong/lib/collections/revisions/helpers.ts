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

/**
 * Load editor-format contents for a revision: prefer `RevisionOriginalContents`
 * (via `originalContentsId`) when present, otherwise the inline `originalContents`
 * column (may appear in the denormalized-field variant for things that haven't
 * been migrated yet).
 */
export async function getStoredOriginalContentsForRevision(
  revision: {
    _id?: string | null,
    originalContentsId?: string | null,
    originalContents?: RevisionOriginalContentsData | null,
  },
  context: ResolverContext,
): Promise<RevisionOriginalContentsData | null> {
  if (revision.originalContentsId) {
    const roc = await context.loaders.RevisionOriginalContents.load(revision.originalContentsId);
    if (roc?.originalContents) {
      return roc.originalContents;
    }
  }
  if (revision.originalContents) {
    return revision.originalContents;
  }
  if (revision._id) {
    const storedRevision = await context.loaders.Revisions.load(revision._id);
    if (storedRevision?.originalContentsId) {
      const roc = await context.loaders.RevisionOriginalContents.load(storedRevision.originalContentsId);
      return roc?.originalContents ?? null;
    }
  }
  return null;
}

export async function getRevisionOriginalContentsByRevisionId(
  revisionId: string,
  context: ResolverContext,
): Promise<RevisionOriginalContentsData | null> {
  const revision = await context.loaders.Revisions.load(revisionId);
  return getStoredOriginalContentsForRevision(revision, context);
}
