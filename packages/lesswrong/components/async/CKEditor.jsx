import React from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-balloon-block';
import Helmet from 'react-helmet';
const Editor = ({ data, onChange }) => {
  console.log("CKEditor data: ", data)
  return <div>
    <Helmet>
      <script type="text/javascript" async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js?config=TeX-MML-AM_CHTML" />
    </Helmet>
    <CKEditor
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
      } }
    />
  </div>
}
export default Editor