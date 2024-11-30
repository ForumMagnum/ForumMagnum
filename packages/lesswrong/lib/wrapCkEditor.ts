import { ForumTypeString } from "./instanceSettings";

export const getCkEditor = (forumType: ForumTypeString) => {
  const ckEditor = bundleIsServer ? {} : require('../../../public/lesswrong-editor/build/ckeditor');

  const { EditorWatchdog, getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { EditorWatchdog, getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

let commentEditor: any = null;
export const getCkCommentEditor = (forumType: ForumTypeString) => {
  const { getCommentEditor } = getCkEditor(forumType);
  if (!commentEditor) {
    commentEditor = getCommentEditor(forumType);
  }
  return commentEditor;
}

let postEditor: any = null;
let postEditorCollaborative: any = null;
export const getCkPostEditor = (isCollaborative: boolean, forumType: ForumTypeString) => {
  const { getPostEditor, getPostEditorCollaboration } = getCkEditor(forumType);
  if (isCollaborative) {
    if (!postEditorCollaborative) {
      postEditorCollaborative = getPostEditorCollaboration(forumType);
    }
    return postEditorCollaborative;
  } else {
    if (!postEditor) {
      postEditor = getPostEditor(forumType);
    }
    return postEditor;
  }
}

export const ckEditorBundleVersion = "43.1.1";
