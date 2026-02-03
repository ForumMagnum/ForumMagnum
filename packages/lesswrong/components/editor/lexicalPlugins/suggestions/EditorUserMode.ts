export const EditorUserMode = {
  Edit: 'edit',
  Preview: 'preview',
  Suggest: 'suggest',
} as const;

export type EditorUserModeType = (typeof EditorUserMode)[keyof typeof EditorUserMode];
