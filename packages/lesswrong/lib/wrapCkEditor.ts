import { getCkEditor } from "@/client/importCkEditor";

let commentEditor: any = null;
export const getCkCommentEditor = () => {
  const { getCommentEditor } = getCkEditor();
  if (!commentEditor) {
    commentEditor = getCommentEditor();
  }
  return commentEditor;
}

let postEditor: any = null;
let postEditorCollaborative: any = null;
export const getCkPostEditor = (isCollaborative: boolean) => {
  const { getPostEditor, getPostEditorCollaboration } = getCkEditor();
  if (isCollaborative) {
    if (!postEditorCollaborative) {
      postEditorCollaborative = getPostEditorCollaboration();
    }
    return postEditorCollaborative;
  } else {
    if (!postEditor) {
      postEditor = getPostEditor();
    }
    return postEditor;
  }
}

export const ckEditorBundleVersion = "43.1.6";
