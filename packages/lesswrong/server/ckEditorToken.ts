import { addStaticRoute, getUserFromReq } from './vulcan-lib';
import { Posts } from '../lib/collections/posts'
import { postCanEdit } from '../lib/collections/posts/helpers'
import { getCKEditorDocumentId } from '../lib/ckEditorUtils'
import Users from '../lib/collections/users/collection';
import jwt from 'jsonwebtoken'
import { DatabaseServerSetting } from './databaseSettings';

const ckEditorEnvironmentIdSetting = new DatabaseServerSetting<string | null>('ckEditor.environmentId', null)
const ckEditorSecrretKeySetting = new DatabaseServerSetting<string | null>('ckEditor.secretKey', null)

addStaticRoute('/ckeditor-token', async ({ query }, req, res, next) => {
  const environmentId = ckEditorEnvironmentIdSetting.get()
  const secretKey = ckEditorSecrretKeySetting.get()! // Assume nonnull; causes lack of encryption in development
  
  const documentId = req.headers['document-id']
  const userId = req.headers['user-id']
  const formType = req.headers['form-type']
  
  const ckEditorId = getCKEditorDocumentId(documentId, userId, formType)

  const user = await getUserFromReq(req)
  const post = await Posts.findOne(documentId)
  const canEdit = post && postCanEdit(user, post)  
  const canView = post && await Posts.checkAccess(user, post, null)

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
      name: Users.getDisplayName(user)
    } : null,
    services: {
      'ckeditor-collaboration': {
        permissions
      }
    }
  };
  
  const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
  
  res.end( result );
})
