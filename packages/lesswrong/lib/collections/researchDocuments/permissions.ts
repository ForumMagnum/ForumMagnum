import { userIsAdmin } from "@/lib/vulcan-users/permissions";

type CollabAccessLevel = 'none' | 'read' | 'comment' | 'edit';

/**
 * Compute the collab-editor access level a user has on a ResearchDocument.
 *
 * Prototype scope: a research document is editable by the project's owner and
 * by site admins. Anything else is denied. Sharing-key flows are not yet
 * supported; we accept a `linkSharingKey` arg in the API surface but ignore it
 * here.
 */
export async function getResearchDocumentAccess(
  documentId: string,
  currentUser: DbUser | null,
  context: ResolverContext,
): Promise<CollabAccessLevel> {
  if (!currentUser) {
    return 'none';
  }
  if (userIsAdmin(currentUser)) {
    return 'edit';
  }
  const document = await context.ResearchDocuments.findOne({ _id: documentId });
  if (!document) {
    return 'none';
  }
  const project = await context.ResearchProjects.findOne({ _id: document.projectId });
  if (!project) {
    return 'none';
  }
  if (project.userId === currentUser._id) {
    return 'edit';
  }
  return 'none';
}
