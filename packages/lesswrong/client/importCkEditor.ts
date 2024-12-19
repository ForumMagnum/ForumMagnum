export const getCkEditor = () => {
  const ckEditor = bundleIsServer ? {} : require(`../../../ckEditor/build/ckeditor`);
  const { getCommentEditor, getPostEditor, getPostEditorCollaboration } = ckEditor;
  return { getCommentEditor, getPostEditor, getPostEditorCollaboration };
}

