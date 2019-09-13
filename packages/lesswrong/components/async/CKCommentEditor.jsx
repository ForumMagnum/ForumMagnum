import React from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { CommentEditor } from '@lesswrong/lesswrong-editor';
// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const CKCommentEditor = ({ data, onSave, onInit }) => {
  return <div>
    <CKEditor
      editor={ CommentEditor }
      data={data}
      onInit={ editor => {
          // Uncomment the line below and the import above to activate the debugger
          // CKEditorInspector.attach(editor)
          onInit(editor)
      } }
      config={{
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        },
      }}
    />
  </div>
}
export default CKCommentEditor
