import React from 'react'
import ClassicEditor from '@lesswrong/lesswrong-editor';
import { getSetting } from 'meteor/vulcan:core';
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import Helmet from 'react-helmet';

const uploadUrl = getSetting('ckEditor.uploadUrl', null)
const webSocketUrl = getSetting('ckEditor.webSocketUrl', null)
const Editor = ({ data, onSave, documentId, userId, formType }) => {
  return <div>
    {/* <Helmet>
      <script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML" />
    </Helmet> */}
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
    {/* <CKEditor
      editor={ ClassicEditor }
      data={data}
      onInit={ editor => {
          // You can store the "editor" and use when it is needed.
          console.log( 'Editor is ready to use!', editor );
      } }
      onChange={ ( event, editor ) => {
          const data = editor.getData();
          onChange(data)
      } }
      onBlur={ editor => {
          console.log( 'Blur.', editor );
      } }
      onFocus={ editor => {
          console.log( 'Focus.', editor );
      } } */}
  </div>
}
export default Editor

function generateTokenRequest(documentId, userId, formType) {
  return () => {
    return new Promise( ( resolve, reject ) => {
        const xhr = new XMLHttpRequest();
  
        xhr.open( 'GET', '/ckeditor-token' );
  
        xhr.addEventListener( 'load', () => {
            const statusCode = xhr.status;
            const xhrResponse = xhr.response;
  
            if ( statusCode < 200 || statusCode > 299 ) {
                return reject( new Error( 'Cannot download a new token!' ) );
            }
  
            return resolve( xhrResponse );
        } );
  
        xhr.addEventListener( 'error', () => reject( new Error( 'Network error' ) ) );
        xhr.addEventListener( 'abort', () => reject( new Error( 'Abort' ) ) );
  
        if (documentId) xhr.setRequestHeader( 'document-id', documentId );
        if (userId) xhr.setRequestHeader( 'user-id', userId );
        if (formType) xhr.setRequestHeader( 'form-type', formType );
  
        xhr.send();
    } );
  }
}
