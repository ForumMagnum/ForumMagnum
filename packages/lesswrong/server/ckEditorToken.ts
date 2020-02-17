import { addStaticRoute, getUserFromReq, getSetting } from './vulcan-lib';
import { Posts } from '../lib/collections/posts'
import { getCKEditorDocumentId } from '../lib/ckEditorUtils'
import Users from '../lib/collections/users/collection';
import jwt from 'jsonwebtoken'

addStaticRoute('/ckeditor-token', async ({ query }, req, res, next) => {
  const environmentId = getSetting('ckEditor.environmentId', null)
  const secretKey = getSetting('ckEditor.secretKey', null)
  
  const documentId = req.headers['document-id']
  const userId = req.headers['user-id']
  const formType = req.headers['form-type']
  
  const ckEditorId = getCKEditorDocumentId(documentId, userId, formType)

  const user = await getUserFromReq(req)
  const post = await Posts.findOne(documentId)
  const canEdit = post && Posts.canEdit(user, post)  
  const canView = post && Posts.checkAccess(user, post)

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
    user: {
      id: user._id,
      name: Users.getDisplayName(user)
    },
    services: {
      'ckeditor-collaboration': {
        permissions
      }
    }
  };
  
  const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
  
  res.end( result );
})
