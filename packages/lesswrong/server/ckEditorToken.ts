import { getUserFromReq } from './vulcan-lib/apollo-server/context';
import { Posts } from '../lib/collections/posts'
import { userIsPostGroupOrganizer } from '../lib/collections/posts/helpers'
import { getCKEditorDocumentId } from '../lib/ckEditorUtils'
import { userGetDisplayName } from '../lib/collections/users/helpers';
import jwt from 'jsonwebtoken'
import { DatabaseServerSetting } from './databaseSettings';
import { userCanDo, userOwns } from '../lib/vulcan-users/permissions';

const ckEditorEnvironmentIdSetting = new DatabaseServerSetting<string | null>('ckEditor.environmentId', null)
const ckEditorSecrretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.secretKey', null)

export async function ckEditorTokenHandler (req, res, next) {
  const environmentId = ckEditorEnvironmentIdSetting.get()
  const secretKey = ckEditorSecrretKeySetting.get()! // Assume nonnull; causes lack of encryption in development

  const documentId = req.headers['document-id']
  const userId = req.headers['user-id']
  const formType = req.headers['form-type']
  
  if (Array.isArray(documentId)) throw new Error("Multiple documentId headers");
  if (Array.isArray(userId)) throw new Error("Multiple userId headers");
  if (Array.isArray(formType)) throw new Error("Multiple formType headers");
  
  const ckEditorId = getCKEditorDocumentId(documentId, userId, formType)

  const user = await getUserFromReq(req)
  const post = documentId && await Posts.findOne(documentId)
  const canEdit = post && (userOwns(user, post) || userCanDo(user, 'posts.edit.all') || await userIsPostGroupOrganizer(user, post))
  const canView = post && await Posts.checkAccess?.(user, post, null)

  let permissions = {}
  if (formType === "new" && userId) {
    permissions = {
      [ckEditorId]: 'write'
    }
  } else if (canEdit) {
    permissions = {
      [ckEditorId]: 'write'
    }
  } else if (canView) {
    permissions = {
      [ckEditorId]: 'view'
    }
  }
  
  const payload = {
    iss: environmentId,
    user: user ? {
      id: user._id,
      name: userGetDisplayName(user)
    } : null,
    services: {
      'ckeditor-collaboration': {
        permissions
      }
    }
  };
  
  const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
  
  res.writeHead(200, {
    "Content-Type": "application/octet-stream"
  });
  res.end( result );
}
