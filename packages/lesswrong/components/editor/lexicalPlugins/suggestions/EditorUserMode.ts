export const EditorUserMode = {
  Edit: 'edit',
  Suggest: 'suggest',
  View: 'view',
} as const;

export type EditorUserModeType = (typeof EditorUserMode)[keyof typeof EditorUserMode];

export function getDefaultEditorUserMode(canEdit: boolean | undefined, canComment: boolean | undefined): EditorUserModeType {
  if (canEdit) return EditorUserMode.Edit;
  if (canComment) return EditorUserMode.Suggest;
  return EditorUserMode.View;
}
