export const EditorUserMode = {
  Edit: 'edit',
  Suggest: 'suggest',
  View: 'view',
} as const;

export type EditorUserModeType = (typeof EditorUserMode)[keyof typeof EditorUserMode];
