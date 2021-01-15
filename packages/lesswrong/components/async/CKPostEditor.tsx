import React, { useRef, useState, useEffect } from 'react'
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor } from '../../lib/wrapCkEditor';
import { getCKEditorDocumentId, generateTokenRequest } from '../../lib/ckEditorUtils'
import { withStyles, createStyles } from '@material-ui/core/styles';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings';
// Uncomment this line and the reference below to activate the CKEditor debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const styles = createStyles((theme: ThemeType): JssStyles => ({
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
}))

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


const CKPostEditor = ({ data, onSave, onChange, documentId, userId, formType, onInit, classes, collaboration }) => {
  const { PostEditor, PostEditorCollaboration } = getCkEditor();
  
  // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const sidebarRef = useRef(null)
  const presenceListRef = useRef(null)

  const ckEditorCloudConfigured = !!ckEditorWebsocketUrlSetting.get()
  const initData = typeof(data) === "string" ? data : ""

  return <div>
    <div ref={presenceListRef} />
    
    {/* Because of a bug in CKEditor, we call preventDefault on all click events coming out of the sidebar. See: https://github.com/ckeditor/ckeditor5/issues/1992 */}
    <div ref={sidebarRef} className={classes.sidebar} onClick={(e) => e.preventDefault()}/>

    {layoutReady && <CKEditor
      onChange={onChange}
      editor={ collaboration ? PostEditorCollaboration : PostEditor }
      onInit={ editor => {
          if (collaboration) {
            // Uncomment this line and the import above to activate the CKEDItor debugger
            // CKEditorInspector.attach(editor)

            // We listen to the current window size to determine how to show comments
            window.addEventListener( 'resize', () => refreshDisplayMode(editor, sidebarRef.current) );
            // We then call the method once to determine the current window size
            refreshDisplayMode(editor, sidebarRef.current);
          }
          if (onInit) onInit(editor)
      } }
      config={{
        autosave: {
          save (editor) {
            return onSave && onSave( editor.getData() )
          }
        },
        cloudServices: ckEditorCloudConfigured ? {
          tokenUrl: generateTokenRequest(documentId, userId, formType),
          uploadUrl: ckEditorUploadUrlSetting.get(),
          webSocketUrl: ckEditorWebsocketUrlSetting.get(),
          documentId: getCKEditorDocumentId(documentId, userId, formType)
        } : undefined,
        collaboration: ckEditorCloudConfigured ? {
          channelId: getCKEditorDocumentId(documentId, userId, formType)
        } : undefined,
        sidebar: {
          container: sidebarRef.current
        },
        presenceList: {
          container: presenceListRef.current
        },
        initialData: initData
      }}
    />}
  </div>
}
export default withStyles(styles)(CKPostEditor)
