import React, { useRef, useState, useEffect } from 'react'
import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor, ckEditorBundleVersion } from '../../lib/wrapCkEditor';
import { getCKEditorDocumentId, generateTokenRequest} from '../../lib/ckEditorUtils'
import { CollaborativeEditingAccessLevel, accessLevelCan } from '../../lib/collections/posts/collabEditingPermissions';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting } from '../../lib/instanceSettings';
import { CollaborationMode } from './EditorTopBar';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { debateEditorPlaceholder, defaultEditorPlaceholder, linkpostEditorPlaceholder, questionEditorPlaceholder } from '../../lib/editor/make_editable';
import { mentionPluginConfiguration } from "../../lib/editor/mentionsConfig";

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
})

const refreshDisplayMode = ( editor: any, sidebarElement: HTMLDivElement | null ) => {
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


const CKPostEditor = ({
  data,
  collectionName,
  fieldName,
  onSave,
  onChange,
  onFocus,
  documentId,
  userId,
  formType,
  onInit,
  isCollaborative,
  accessLevel,
  placeholder,
  classes,
}: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  onFocus?: (event: AnyBecauseTodo, editor: AnyBecauseTodo) => void,
  documentId?: string,
  userId?: string,
  formType?: "new"|"edit",
  onInit?: any,
  // Whether this is the contents field of a collaboratively-edited post
  isCollaborative?: boolean,
  // If this is the contents field of a collaboratively-edited post, the access level the
  // logged in user has. Otherwise undefined.
  accessLevel?: CollaborativeEditingAccessLevel,
  placeholder?: string,
  classes: ClassesType,
}) => {
  const { EditorTopBar } = Components;
  const { PostEditor, PostEditorCollaboration } = getCkEditor();
  const getInitialCollaborationMode = () => {
    if (!isCollaborative || !accessLevel) return "Editing";
    if (accessLevelCan(accessLevel, "edit"))
      return "Editing";
    else if (accessLevelCan(accessLevel, "comment"))
      return "Commenting";
    else
      return "Viewing";
  }
  const initialCollaborationMode = getInitialCollaborationMode()
  const [collaborationMode,setCollaborationMode] = useState<CollaborationMode>(initialCollaborationMode);

  // Get the linkSharingKey, if it exists
  const { query : { key } } = useSubscribedLocation();
  
  // To make sure that the refs are populated we have to do two rendering passes
  const [layoutReady, setLayoutReady] = useState(false)
  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const editorRef = useRef<CKEditor>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const presenceListRef = useRef<HTMLDivElement>(null)

  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const initData = typeof(data) === "string" ? data : ""
  
  const applyCollabModeToCkEditor = (editor: any, mode: CollaborationMode) => {
    switch(mode) {
      case "Viewing":
        editor.isReadOnly = true;
        editor.commands.get('trackChanges').value = false;
        break;
      case "Commenting":
        editor.isReadOnly = false;
        editor.commands.get('trackChanges').value = true;
        break;
      case "Editing":
        editor.isReadOnly = false;
        editor.commands.get('trackChanges').value = false;
        break;
    }
  }
  const changeCollaborationMode = (mode: CollaborationMode) => {
    const editor = editorRef.current?.editor;
    if (editor) {
      applyCollabModeToCkEditor(editor, mode);
    }
    setCollaborationMode(mode);
  }

  return <div>
    {isCollaborative && <EditorTopBar
      accessLevel={accessLevel||"none"}
      presenceListRef={presenceListRef}
      collaborationMode={collaborationMode}
      setCollaborationMode={changeCollaborationMode}
    />}
    
    <div ref={sidebarRef} className={classes.sidebar}/>

    {layoutReady && <CKEditor
      ref={editorRef}
      onChange={onChange}
      onFocus={onFocus}
      editor={isCollaborative ? PostEditorCollaboration : PostEditor}
      data={data}
      onInit={(editor: any) => {
        if (isCollaborative) {
          // Uncomment this line and the import above to activate the CKEditor debugger
          // CKEditorInspector.attach(editor)

          // We listen to the current window size to determine how to show comments
          window.addEventListener( 'resize', () => refreshDisplayMode(editor, sidebarRef.current) );
          // We then call the method once to determine the current window size
          refreshDisplayMode(editor, sidebarRef.current);
          
          applyCollabModeToCkEditor(editor, collaborationMode);
          
          editor.keystrokes.set('CTRL+ALT+M', 'addCommentThread')
        }
        if (onInit) onInit(editor)
      }}
      config={{
        autosave: {
          save (editor: any) {
            return onSave && onSave(editor.getData())
          }
        },
        cloudServices: ckEditorCloudConfigured ? {
          tokenUrl: generateTokenRequest(collectionName, fieldName, documentId, userId, formType, key),
          uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
          webSocketUrl: webSocketUrl,
          documentId: getCKEditorDocumentId(documentId, userId, formType),
          bundleVersion: ckEditorBundleVersion,
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
        initialData: initData,
        placeholder: placeholder ?? defaultEditorPlaceholder,
        mention: mentionPluginConfiguration
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
