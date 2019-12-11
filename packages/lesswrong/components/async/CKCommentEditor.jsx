import React from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { CommentEditor } from '@lesswrong/lesswrong-editor';
import { generateTokenRequest } from '../../lib/ckEditorUtils'
import { getSetting } from 'meteor/vulcan:core';

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';
const uploadUrl = getSetting('ckEditor.uploadUrl', null)

const CKCommentEditor = ({ data, onSave, onChange, onInit }) => {
  const ckEditorCloudConfigured = !!getSetting("ckEditor.webSocketUrl");
  
  return <CKEditor
      editor={ CommentEditor }
      data={data || ""}
      onInit={ editor => {
          // Uncomment the line below and the import above to activate the debugger
          // CKEditorInspector.attach(editor)
          onInit(editor)
      } }
      onChange={onChange}
      config={{
        cloudServices: ckEditorCloudConfigured ? {
          tokenUrl: generateTokenRequest(),
          uploadUrl,
        } : undefined,
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        }
      }}
    />
}
export default CKCommentEditor
