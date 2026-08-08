import { getDocumentSummary } from '@/lib/notificationDataHelpers';

export type LinkedDocumentType = 'post' | 'comment';

export interface LinkedDocumentRef {
  documentType: LinkedDocumentType
  documentId: string
}

/**
 * `extraData` on a newPingback notification, listing the recipient's own
 * posts/comments that the notification's document links to.
 */
export interface PingbackNotificationExtraData {
  linkedDocuments: LinkedDocumentRef[]
}

function isLinkedDocumentRef(ref: unknown): ref is LinkedDocumentRef {
  if (typeof ref !== 'object' || ref === null) return false;
  if (!('documentType' in ref) || !('documentId' in ref)) return false;
  return typeof ref.documentId === 'string'
    && (ref.documentType === 'post' || ref.documentType === 'comment');
}

export function getLinkedDocuments(extraData?: Record<string, unknown> | null): LinkedDocumentRef[] {
  const linkedDocuments = extraData?.linkedDocuments;
  if (!Array.isArray(linkedDocuments)) return [];
  return linkedDocuments.filter(isLinkedDocumentRef);
}

/**
 * Describe what was linked to without needing to load anything, eg
 * "your comment" or "3 of your posts".
 */
export function summarizeLinkedDocuments(linkedDocuments: LinkedDocumentRef[]): string {
  if (!linkedDocuments.length) return 'your content';
  if (linkedDocuments.length === 1) {
    return linkedDocuments[0].documentType === 'comment' ? 'your comment' : 'your post';
  }

  const postCount = linkedDocuments.filter(({ documentType }) => documentType === 'post').length;
  const commentCount = linkedDocuments.length - postCount;
  if (!commentCount) return `${postCount} of your posts`;
  if (!postCount) return `${commentCount} of your comments`;
  return `${linkedDocuments.length} of your posts and comments`;
}

async function describeLinkedDocuments(
  linkedDocuments: LinkedDocumentRef[],
  context: ResolverContext,
): Promise<string> {
  if (linkedDocuments.length !== 1) {
    return summarizeLinkedDocuments(linkedDocuments);
  }

  const { documentType, documentId } = linkedDocuments[0];
  const summary = await getDocumentSummary(documentType, documentId, context);
  const title = summary?.displayName;
  if (documentType === 'comment') {
    return title ? `your comment on "${title}"` : 'your comment';
  }
  return title ? `your post "${title}"` : 'your post';
}

function asLinkedDocumentType(documentType: string | null): LinkedDocumentType | null {
  return documentType === 'post' || documentType === 'comment' ? documentType : null;
}

async function describeLinkingDocument(
  documentType: LinkedDocumentType | null,
  documentId: string | null,
  context: ResolverContext,
): Promise<{authorName: string, description: string}> {
  const summary = await getDocumentSummary(documentType, documentId, context);
  const authorName = summary?.associatedUserName ?? 'Someone';
  if (!summary?.displayName) {
    return { authorName, description: documentType === 'comment' ? 'a comment' : 'their post' };
  }
  return {
    authorName,
    description: documentType === 'comment'
      ? `a comment on "${summary.displayName}"`
      : `"${summary.displayName}"`,
  };
}

export async function getPingbackNotificationMessage({ documentType, documentId, extraData, context }: {
  documentType: string | null,
  documentId: string | null,
  extraData?: Record<string, unknown> | null,
  context: ResolverContext,
}): Promise<string> {
  const [linkedDescription, { authorName, description }] = await Promise.all([
    describeLinkedDocuments(getLinkedDocuments(extraData), context),
    describeLinkingDocument(asLinkedDocumentType(documentType), documentId, context),
  ]);
  return `${authorName} linked to ${linkedDescription} in ${description}`;
}
