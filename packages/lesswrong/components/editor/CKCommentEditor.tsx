import React, { useEffect } from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { defaultEditorPlaceholder } from '../../lib/editor/make_editable';
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Collaboration from '@tiptap/extension-collaboration'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { MathExtension } from "./tip-tap-plugins/math-plugin";

import * as Y from 'yjs'
import { Helmet } from '../../lib/utils/componentsWithChildren';

// Uncomment the import and the line below to activate the debugger
// import CKEditorInspector from '@ckeditor/ckeditor5-inspector';



const CKCommentEditor = ({
  data,
  collectionName,
  fieldName,
  onSave,
  onChange,
  onFocus,
  onInit,
  placeholder,
  documentId
}: {
  data?: any,
  collectionName: CollectionNameString,
  fieldName: string,
  onSave?: any,
  onChange?: any,
  onFocus?: (event: AnyBecauseTodo, editor: AnyBecauseTodo) => void,
  onInit?: any,
  placeholder?: string,
  documentId?: string
}) => {

  const doc = new Y.Doc()
  const content = data ?? `<p>${placeholder ?? defaultEditorPlaceholder}</p>`

  const provider = new TiptapCollabProvider({
    name: `${collectionName}-${fieldName}-${documentId ?? 'new'}`,
    appId: "J9Y8JXK1",
    token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MTQyNjI2MDUsIm5iZiI6MTcxNDI2MjYwNSwiZXhwIjoxNzE0MzQ5MDA1LCJpc3MiOiJodHRwczovL2Nsb3VkLnRpcHRhcC5kZXYiLCJhdWQiOiJqOXk4anhrMSJ9.pzGCVm82OT0I74Dx8qW0PNsRvfSGERqS049ZoKaRZJ8',
    document: doc,
    onSynced() {
      if( !doc.getMap('config').get('initialContentLoaded') && editor ){
        doc.getMap('config').set('initialContentLoaded', true);

        editor.commands.setContent(content)
      }
    }
  })

  const extensions = [
    Document,
    Paragraph,
    Text,
    MathExtension.configure({
      addInlineMath: true
    }),
    Collaboration.configure({
      document: doc
    })
  ]

  const editor = useEditor({
    extensions,
  })

  useEffect(() => {
    console.log({data})
    onInit(editor)
  }, [editor])

  return (editor && <>
      <EditorContent editor={editor} />
    </>
  )

  // const webSocketUrl = ckEditorWebsocketUrlOverrideSetting.get() || ckEditorWebsocketUrlSetting.get();
  // const ckEditorCloudConfigured = !!webSocketUrl;
  // const { CommentEditor } = getCkEditor(forumTypeSetting.get());

  // return <div>
  //   <CKEditor
  //     editor={CommentEditor}
  //     onInit={(editor: any) => {
  //       // Uncomment the line below and the import above to activate the debugger
  //       // CKEditorInspector.attach(editor)
  //       if (onInit) onInit(editor)
  //       return editor
  //     }}
  //     onChange={onChange}
  //     onFocus={onFocus}
  //     config={{
  //       cloudServices: ckEditorCloudConfigured ? {
  //         // A tokenUrl token is needed here in order for image upload to work.
  //         // (It's accessible via drag-and-drop onto the comment box, and is
  //         // stored on CkEditor's CDN.)
  //         //
  //         // The collaborative editor is not activated because no `websocketUrl`
  //         // or `documentId` is provided.
  //         tokenUrl: generateTokenRequest(collectionName, fieldName),
  //         uploadUrl: ckEditorUploadUrlOverrideSetting.get() || ckEditorUploadUrlSetting.get(),
  //         bundleVersion: ckEditorBundleVersion,
  //       } : undefined,
  //       autosave: {
  //         save (editor: any) {
  //           return onSave && onSave( editor.getData() )
  //         }
  //       },
  //       initialData: data || "",
  //       placeholder: placeholder ?? defaultEditorPlaceholder,
  //       mention: mentionPluginConfiguration,
  //       ...cloudinaryConfig,
  //     }}
  //     data={data}
  //   />
  // </div>
}

const CKCommentEditorComponent = registerComponent("CKCommentEditor", CKCommentEditor);
declare global {
  interface ComponentTypes {
    CKCommentEditor: typeof CKCommentEditorComponent
  }
}
