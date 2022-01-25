import React, { useRef, useState, useEffect } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor } from '../../lib/wrapCkEditor';
import { getCKEditorDocumentId, generateTokenRequest} from '../../lib/ckEditorUtils'
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting } from '../../lib/instanceSettings';

// Uncomment this line and the reference below to activate the CKEditor debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const styles = (theme: ThemeType): JssStyles => ({
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
  },
  presenceList: {
    '& .ck-user': { //.CKPostEditor-presenceList .ck-user__name
      backgroundColor: theme.palette.grey[400] + '!important',
      borderRadius: '0% !important'
    },
    '& .ck-user__name': { //.CKPostEditor-presenceList .ck-user__name
      color: theme.palette.backgroundColor + '!important',
      fontFamily: theme.typography.commentStyle.fontFamily + '!important',
      fontSize: '1.2rem'
    }
  }
})

const refreshDisplayMode = ( editor, sidebarElement ) => {
  if (!sidebarElement) return null
  const annotationsUIs = editor.plugins.get( 'AnnotationsUIs' );
  
  if ( window.innerWidth < 1000 ) {
    sidebarElement.classList.remove( 'narrow' );
    sidebarElement.classList.add( 'hidden' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('inline');
  }
  else if ( window.innerWidth < 1400 ) {
    sidebarElement.classList.remove( 'hidden' );
    sidebarElement.classList.add( 'narrow' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('narrowSidebar');
  }
  else {
    sidebarElement.classList.remove( 'hidden', 'narrow' );
    
    annotationsUIs.deactivateAll();
    annotationsUIs.activate('wideSidebar');
  }
}


const CKPostEditor = ({ data, collectionName, fieldName, onSave, onChange, documentId, userId, formType, onInit, classes, collaboration }: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  documentId?: string,
  userId?: string,
  formType?: "new"|"edit",
  onInit?: any,
  collaboration?: boolean,
  classes: ClassesType,
}) => {
  const { PostEditor, PostEditorCollaboration } = getCkEditor();
  
  // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const sidebarRef = useRef(null)
  const presenceListRef = useRef(null)

  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const initData = typeof(data) === "string" ? data : ""

  return <div>
    <div className={classes.presenceList} ref={presenceListRef} />
    
    <div ref={sidebarRef} className={classes.sidebar}/>

    {layoutReady && <CKEditor
      onChange={onChange}
      editor={ collaboration ? PostEditorCollaboration : PostEditor }
      data={data}
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
          tokenUrl: generateTokenRequest(collectionName, fieldName, documentId, userId, formType),
          uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
          webSocketUrl: webSocketUrl,
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

const CKPostEditorComponent = registerComponent("CKPostEditor", CKPostEditor, {styles});
declare global {
  interface ComponentTypes {
    CKPostEditor: typeof CKPostEditorComponent
  }
}
