import React from 'react'
import ClassicEditor from '@lesswrong/comment-editor';
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const Editor = ({ data, onSave }) => {
  return <div>
    <ClassicEditor 
      data={data}
      onSave={onSave}
      onReady={editor => console.log("Editor is ready")}
    />
  </div>
}
export default Editor