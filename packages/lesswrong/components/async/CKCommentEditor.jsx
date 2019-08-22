import React from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { CommentEditor } from '@lesswrong/lesswrong-editor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const Editor = ({ data, onSave }) => {
  return <div>
    <CKEditor
      editor={ CommentEditor }
      data="<p>Hello from CKEditor 5!</p>"
      onInit={ editor => {
          // You can store the "editor" and use when it is needed.
          console.log( 'Editor is ready to use!', editor );
          CKEditorInspector.attach(editor)
      } }
      config={{
        autosave: {
          save (editor) {
            return onSave( editor.getData() )
          }
        },
      }}
      onChange={ ( event, editor ) => {
          const data = editor.getData();
          console.log( { event, editor, data } );
      } }
      onBlur={ editor => {
          console.log( 'Blur.', editor );
      } }
      onFocus={ editor => {
          console.log( 'Focus.', editor );
      } }
    />
  </div>
}
export default Editor