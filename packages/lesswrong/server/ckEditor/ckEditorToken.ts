import { getUserFromReq } from '../vulcan-lib/apollo-server/context';
import { Posts } from '../../lib/collections/posts'
import { userIsPostGroupOrganizer } from '../../lib/collections/posts/helpers'
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { getCkEditorEnvironmentId, getCkEditorSecretKey } from './ckEditorServerConfig';
import { CollaborativeEditingAccessLevel, strongerAccessLevel } from '../../components/editor/PostSharingSettings';
import { userCanDo, userOwns } from '../../lib/vulcan-users/permissions';
import jwt from 'jsonwebtoken'
import * as _ from 'underscore';

async function getCollaborativeEditorAccess({formType, post, user}: {
  formType: "new"|"edit",
  post: DbPost|null,
  user: DbUser|null,
}): Promise<CollaborativeEditingAccessLevel> {
  const canEdit = post && (userOwns(user, post) || userCanDo(user, 'posts.edit.all') || await userIsPostGroupOrganizer(user, post))
  const canView = post && await Posts.checkAccess(user, post, null);
  let accessLevel: CollaborativeEditingAccessLevel = "none";
  
  if (formType === "new" && user && !post) {
    accessLevel = strongerAccessLevel(accessLevel, "edit");
    return "edit";
  }
  if (!post || !user) {
    return "none";
  }
  
  if (canEdit) {
    accessLevel = strongerAccessLevel(accessLevel, "edit");
  }
  
  accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.anyoneWithLinkCan);
  
  if (_.contains(post.shareWithUsers, user._id)) {
    accessLevel = strongerAccessLevel(accessLevel, post.sharingSettings?.explicitlySharedUsersCan);
  }
  
  return accessLevel;
}

function permissionsLevelToCkEditorRole(access: CollaborativeEditingAccessLevel): string {
  switch (access) {
    case "edit": return "writer";
    case "comment": return "commentator";
    case "read": return "reader";
    case "none": return "";
  }
}

export async function ckEditorTokenHandler (req, res, next) {
  const environmentId = getCkEditorEnvironmentId();
  const secretKey = getCkEditorSecretKey()!; // Assume nonnull; causes lack of encryption in development

  const documentId = req.headers['document-id'];
  const userId = req.headers['user-id'];
  const formType = req.headers['form-type'];
  
  if (Array.isArray(documentId)) throw new Error("Multiple documentId headers");
  if (Array.isArray(userId)) throw new Error("Multiple userId headers");
  if (Array.isArray(formType)) throw new Error("Multiple formType headers");
  
  const ckEditorId = getCKEditorDocumentId(documentId, userId, formType)

  const user = await getUserFromReq(req);
  const post = documentId && await Posts.findOne(documentId);
  const access = await getCollaborativeEditorAccess({ formType, post, user });

  if (access === "none") {
    res.writeHead(403, {});
    res.end("Access denied")
    return;
  }
  
  const payload = {
    iss: environmentId,
    user: user ? {
      id: user._id,
      name: userGetDisplayName(user)
    } : null,
    auth: {
      collaboration: {
        [ckEditorId]: {role: permissionsLevelToCkEditorRole(access)}
      },
    },
  };
  
  const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
  
  res.writeHead(200, {
    "Content-Type": "application/octet-stream"
  });
  res.end( result );
}
