import React, { useContext, useState } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { ckEditorBundleVersion, getCkCommentEditor } from '../../lib/wrapCkEditor';
import { generateTokenRequest } from '../../lib/ckEditorUtils';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting, ckEditorUploadUrlOverrideSetting, ckEditorWebsocketUrlOverrideSetting, isEAForum, isLWorAF } from '@/lib/instanceSettings';
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { mentionPluginConfiguration } from "../../lib/editor/mentionsConfig";
import { cloudinaryConfig } from '../../lib/editor/cloudinaryConfig'
import CKEditor from '../../lib/vendor/ckeditor5-react/ckeditor';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { useSyncCkEditorPlaceholder } from '../hooks/useSyncCkEditorPlaceholder';
import { CkEditorPortalContext } from './CKEditorPortalProvider';
import { useDialog } from '../common/withDialog';
import { claimsConfig } from './claims/claimsConfig';
import { useStyles } from '../hooks/useStyles';
import { ckEditorPluginStyles } from './ckEditorStyles';

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const getCommentEditorToolbarConfig = () => ({
  toolbar: [
    'heading',
    '|',
    'bold',
    'italic',
    'strikethrough',
    '|',
    'link',
    '|',
    'blockQuote',
    'bulletedList',
    'numberedList',
    '|',
    'math',
    // Similar to the post editor, we don't have the collapsible sections plugin in the selected-text toolbar,
    // because the behavior of creating a collapsible section while text is selected is non-obvious and we want to fix it first
    ...(isEAForum() ? ['imageUpload', 'ctaButtonToolbarItem', 'pollToolbarItem'] : []),
    'footnote',
    ...(isLWorAF() ? ['collapsibleSectionButton'] : []),
    ...(isLWorAF() ? ['insertClaimButton'] : []),
  ],
});

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
  onReady: (editor: Editor) => void,
  placeholder?: string,
}) => {
  const classes = useStyles(ckEditorPluginStyles);
  const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  const ckEditorCloudConfigured = !!webSocketUrl;
  const CommentEditor = getCkCommentEditor();
  const portalContext = useContext(CkEditorPortalContext);
  const { openDialog } = useDialog();

  const [editorObject, setEditorObject] = useState<Editor | null>(null);

  const actualPlaceholder = placeholder ?? getDefaultEditorPlaceholder();

  const editorConfig = {
    ...getCommentEditorToolbarConfig(),
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
    placeholder: actualPlaceholder,
    mention: mentionPluginConfiguration(portalContext),
    ...cloudinaryConfig,
    claims: claimsConfig(portalContext, openDialog),
  };

  useSyncCkEditorPlaceholder(editorObject, actualPlaceholder);

  return <div className={classes.ckWrapper}>
    <CKEditor
      editor={CommentEditor}
      onReady={(editor: Editor) => {
        setEditorObject(editor);
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

export default registerComponent("CKCommentEditor", CKCommentEditor, {
  debugRerenders: true
});

