import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { ckEditorBundleVersion, getCkCommentEditor } from '../../lib/wrapCkEditor';
import { generateTokenRequest } from '../../lib/ckEditorUtils';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'
import { ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting, forumTypeSetting } from '../../lib/instanceSettings';
import { defaultEditorPlaceholder } from '../../lib/editor/make_editable';
import { mentionPluginConfiguration } from "../../lib/editor/mentionsConfig";
import { cloudinaryConfig } from '../../lib/editor/cloudinaryConfig'
import CKEditor from '../../lib/vendor/ckeditor5-react/ckeditor';

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const CKCommentEditor = ({
  data,
  collectionName,
  fieldName,
  onSave,
  onChange,
  onFocus,
  onReady,
  placeholder,
}: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  onFocus?: (event: AnyBecauseTodo, editor: AnyBecauseTodo) => void,
  onReady: (editor: CKEditor<any>) => void,
  placeholder?: string,
}) => {
  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const CommentEditor = getCkCommentEditor(forumTypeSetting.get());
  
  const editorConfig = {
    cloudServices: ckEditorCloudConfigured ? {
      // A tokenUrl token is needed here in order for image upload to work.
      // (It's accessible via drag-and-drop onto the comment box, and is
      // stored on CkEditor's CDN.)
      //
      // The collaborative editor is not activated because no `websocketUrl`
      // or `documentId` is provided.
      tokenUrl: generateTokenRequest(collectionName, fieldName),
      uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
      bundleVersion: ckEditorBundleVersion,
    } : undefined,
    autosave: {
      save (editor: any) {
        return onSave && onSave( editor.getData() )
      }
    },
    initialData: data || "",
    placeholder: placeholder ?? defaultEditorPlaceholder,
    mention: mentionPluginConfiguration,
    ...cloudinaryConfig,
  };

  return <div>
    <CKEditor
      editor={CommentEditor}
      onReady={(editor: CKEditor<any>) => {
        // Uncomment the line below and the import above to activate the debugger
        // CKEditorInspector.attach(editor)
        onReady(editor)
        return editor
      }}
      onChange={onChange}
      onFocus={onFocus}
      config={editorConfig}
      data={data}
      isCollaborative={false}
    />
  </div>
}

const CKCommentEditorComponent = registerComponent("CKCommentEditor", CKCommentEditor, {
  debugRerenders: true
});
declare global {
  interface ComponentTypes {
    CKCommentEditor: typeof CKCommentEditorComponent
  }
}
