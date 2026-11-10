import jwt from 'jsonwebtoken';
import { getCollaborativeEditorAccessWithKey, type CollaborativeEditingAccessLevel } from '@/lib/collections/posts/collabEditingPermissions';
import { getResearchDocumentAccess } from '@/lib/collections/researchDocuments/permissions';

export interface IssuedHocuspocusAuth {
  token: string
  accessLevel: Exclude<CollaborativeEditingAccessLevel, "none">
}

async function getCollaborativeDocumentAccess({ collectionName, documentId, linkSharingKey, context }: {
  collectionName: string
  documentId: string
  linkSharingKey: string | null
  context: ResolverContext
}): Promise<CollaborativeEditingAccessLevel> {
  const { currentUser, loaders } = context;
  if (collectionName === 'Posts') {
    const post = await loaders.Posts.load(documentId);
    return getCollaborativeEditorAccessWithKey({
      formType: 'edit',
      post,
      user: currentUser,
      context,
      useAdminPowers: true,
      linkSharingKey,
    });
  }
  if (collectionName === 'ResearchDocuments') {
    return getResearchDocumentAccess(documentId, currentUser, context);
  }
  throw new Error(`HocuspocusAuth: unsupported collectionName ${collectionName}`);
}

export async function issueHocuspocusAuth({ collectionName, documentId, linkSharingKey, context }: {
  collectionName: string
  documentId: string
  linkSharingKey: string | null
  context: ResolverContext
}): Promise<IssuedHocuspocusAuth | null> {
  const accessLevel = await getCollaborativeDocumentAccess({ collectionName, documentId, linkSharingKey, context });
  if (accessLevel === 'none') {
    return null;
  }

  const { currentUser, clientId } = context;
  const token = jwt.sign(
    {
      userId: currentUser?._id ?? clientId,
      displayName: currentUser?.displayName ?? 'Anonymous',
      collectionName,
      documentId,
      accessLevel,
    },
    process.env.HOCUSPOCUS_JWT_SECRET!,
    { expiresIn: '1h' }
  );
  return { token, accessLevel };
}
