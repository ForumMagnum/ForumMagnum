import React from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import CKEditor from '../editor/ReactCKEditor';
import { getCkEditor } from '../../lib/wrapCkEditor';
import { generateTokenRequest } from '../../lib/ckEditorUtils';
import { ckEditorUploadUrlSetting, ckEditorWebsocketUrlSetting } from '../../lib/publicSettings'

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';

const CKCommentEditor = ({ data, onSave, onChange, onInit }: {
  data?: any,
  onSave?: any,
  onChange?: any,
  onInit?: any,
}) => {
  const ckEditorCloudConfigured = !!ckEditorWebsocketUrlSetting.get()
  const { CommentEditor } = getCkEditor();
  
  return <div>
      <CKEditor
        editor={ CommentEditor }
        onInit={ editor => {
            // Uncomment the line below and the import above to activate the debugger
            // CKEditorInspector.attach(editor)
            if (onInit) onInit(editor)
            return editor
        } }
        onChange={onChange}
        config={{
          cloudServices: ckEditorCloudConfigured ? {
            tokenUrl: generateTokenRequest(),
            uploadUrl: ckEditorUploadUrlSetting.get(),
          } : undefined,
          autosave: {
            save (editor) {
              return onSave && onSave( editor.getData() )
            }
          },
          initialData: data || ""
        }}
      />
    </div>
}

const CKCommentEditorComponent = registerComponent("CKCommentEditor", CKCommentEditor);
declare global {
  interface ComponentTypes {
    CKCommentEditor: typeof CKCommentEditorComponent
  }
}
