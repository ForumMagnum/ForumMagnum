import React, { useRef, useState, useEffect } from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { PostEditor } from '@lesswrong/lesswrong-editor';
import { getSetting } from 'meteor/vulcan:core';
import { getCKEditorDocumentId, generateTokenRequest } from '../../lib/ckEditorUtils'
import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const uploadUrl = getSetting('ckEditor.uploadUrl', null)
const webSocketUrl = getSetting('ckEditor.webSocketUrl', null)
const Editor = ({ data, onSave, documentId, userId, formType, onInit }) => {
  console.log("Rendering Editor: ", data, documentId, userId)
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  })
  const sidebarRef = useRef(null)
  const presenceListRef = useRef(null)
  return <div>
    <div ref={presenceListRef} />
    <div ref={sidebarRef} />
    {layoutReady && <CKEditor
      editor={ PostEditor }
      onInit={ editor => {
          // You can store the "editor" and use when it is needed.
          console.log( 'Editor is ready to use!', editor );
          CKEditorInspector.attach(editor)
          onInit(editor)
      } }
      config={{
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        },
        cloudServices: {
          tokenUrl: generateTokenRequest(documentId, userId, formType),
          uploadUrl,
          webSocketUrl,
          documentId: getCKEditorDocumentId(documentId, userId, formType)
        },
        sidebar: {
          container: sidebarRef.current
        },
        presenceList: {
          container: presenceListRef.current
        },
        initialData: data
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
    />}
  </div>
}
export default Editor