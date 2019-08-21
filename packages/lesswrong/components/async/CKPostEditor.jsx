import React from 'react'
import ClassicEditor from '@lesswrong/post-editor';
import { getSetting } from 'meteor/vulcan:core';
import { getCKEditorDocumentId, generateTokenRequest } from '../../lib/ckEditorUtils'

const uploadUrl = getSetting('ckEditor.uploadUrl', null)
const webSocketUrl = getSetting('ckEditor.webSocketUrl', null)
const Editor = ({ data, onSave, documentId, userId, formType }) => {
  return <div>
    <ClassicEditor 
      data={data}
      onSave={onSave}
      configuration = {{
        tokenUrl: generateTokenRequest(documentId, userId, formType),
        uploadUrl,
        webSocketUrl,
        documentId: getCKEditorDocumentId(documentId, userId, formType)
      }
    }/>
  </div>
}
export default Editor