import React, { useRef, useState, useEffect } from 'react'
import CKEditor from '@ckeditor/ckeditor5-react';
import { PostEditor } from '@lesswrong/lesswrong-editor';
import { getSetting } from 'meteor/vulcan:core';
import { getCKEditorDocumentId, generateTokenRequest } from '../../lib/ckEditorUtils'
import { withStyles } from '@material-ui/core/styles';
import { Helmet } from 'react-helmet';
// Uncomment this line and the reference below to activate the CKEditor debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const uploadUrl = getSetting('ckEditor.uploadUrl', null)
const webSocketUrl = getSetting('ckEditor.webSocketUrl', null)

const styles = theme => ({
  sidebar: {
    position: 'absolute',
    right: -350,
    width: 300,
    [theme.breakpoints.down('md')]: {
      position: 'absolute',
      right: -100,
      width: 50
    },
    [theme.breakpoints.down('sm')]: {
      right: 0
    }
  }
})

const refreshDisplayMode = ( editor, sidebarElement ) => {
  if (!sidebarElement) return null
  const annotations = editor.plugins.get( 'Annotations' );

  if ( window.innerWidth < 1000 ) {
    sidebarElement.classList.remove( 'narrow' );
    sidebarElement.classList.add( 'hidden' );
    annotations.switchTo( 'inline' );
  }
  else if ( window.innerWidth < 1400 ) {
    sidebarElement.classList.remove( 'hidden' );
    sidebarElement.classList.add( 'narrow' );
    annotations.switchTo( 'narrowSidebar' );
  }
  else {
    sidebarElement.classList.remove( 'hidden', 'narrow' );
    annotations.switchTo( 'wideSidebar' );
  }
}


const CKPostEditor = ({ data, onSave, documentId, userId, formType, onInit, classes }) => {
  // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const sidebarRef = useRef(null)
  const presenceListRef = useRef(null)
  return <div>
    {/* We load Mathjax by inserting a script tag into the header. Not the most elegant, but should be fine */}
    <Helmet> 
      <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-AMS_HTML' async></script>
    </Helmet>
    <div ref={presenceListRef} />
    {/* Because of a bug in CKEditor, we call preventDefault on all click events coming out of the sidebar. See: https://github.com/ckeditor/ckeditor5/issues/1992 */}
    <div ref={sidebarRef} className={classes.sidebar} onClick={(e) => e.preventDefault()}/>
    {layoutReady && <CKEditor
      editor={ PostEditor }
      onInit={ editor => {
          // Uncomment this line and the import above to activate the CKEDItor debugger
          // CKEditorInspector.attach(editor)

          // We listen to the current window size to determine how to show comments
          window.addEventListener( 'resize', () => refreshDisplayMode(editor, sidebarRef.current) );
          // We then call the method once to determine the current window size
          refreshDisplayMode(editor, sidebarRef.current)

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
    />}
  </div>
}
export default withStyles(styles)(CKPostEditor)
