import { computeContextFromUser, getUserFromReq } from '../vulcan-lib/apollo-server/context';
import { Posts } from '../../server/collections/posts/collection'
import { getCollaborativeEditorAccess, CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { getCkEditorEnvironmentId, getCkEditorSecretKey } from './ckEditorServerConfig';
import jwt from 'jsonwebtoken'
import { randomId } from '../../lib/random';

function permissionsLevelToCkEditorRole(access: CollaborativeEditingAccessLevel): string {
  switch (access) {
    case "edit": return "writer";
    case "comment": return "commentator";
    case "read": return "reader";
    case "none": return "";
  }
}

export async function ckEditorTokenHandler (req: AnyBecauseTodo, res: AnyBecauseTodo) {
  const environmentId = getCkEditorEnvironmentId();
  const secretKey = getCkEditorSecretKey()!; // Assume nonnull; causes lack of encryption in development

  const collectionName = req.headers['collection-name'];
  const documentId = req.headers['document-id'];
  const linkSharingKey = req.headers['link-sharing-key'];
  
  if (Array.isArray(collectionName)) throw new Error("Multiple collectionName headers");
  if (Array.isArray(documentId)) throw new Error("Multiple documentId headers");
  
  const user = getUserFromReq(req);
  const requestWithKey = {...req, query: {...req?.query, key: linkSharingKey}}
  const contextWithKey = await computeContextFromUser({user, req: requestWithKey, res, isSSR: false});
  
  if (collectionName === "Posts") {
    const ckEditorId = getCKEditorDocumentId(documentId)
    const post = documentId ? await Posts.findOne(documentId) : null;
    const access = await getCollaborativeEditorAccess({
      formType: "edit",
      post,
      user,
      context: contextWithKey,
      useAdminPowers: true,
    });

    if (access === "none") {
      res.writeHead(403, {});
      res.end("Access denied")
      return;
    }
    
    const payload = {
      aud: environmentId,
      iat: Math.floor(new Date().getTime()/1000.0), //seconds since epoch
      user: {
        id: user ? user._id : randomId(),
        name: user ? userGetDisplayName(user) : "Anonymous"
      },
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
    res.end(result);
  } else {
    const payload = {
      aud: environmentId,
      iat: Math.floor(new Date().getTime()/1000.0), //seconds since epoch
      user: user ? {
        id: user._id,
        name: userGetDisplayName(user)
      } : null,
    };
    
    const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
    
    res.writeHead(200, {
      "Content-Type": "application/octet-stream"
    });
    res.end(result);
  }
}
