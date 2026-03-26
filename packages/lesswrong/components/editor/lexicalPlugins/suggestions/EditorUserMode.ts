import type { ForumIconName } from "@/components/common/ForumIcon";

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

export function getAvailableEditorModes(canEdit: boolean, canComment: boolean): EditorUserModeType[] {
  const modes: EditorUserModeType[] = [];
  if (canEdit) modes.push(EditorUserMode.Edit);
  if (canComment) modes.push(EditorUserMode.Suggest);
  modes.push(EditorUserMode.View);
  return modes;
}

export const editorModeLabels: Record<EditorUserModeType, string> = {
  [EditorUserMode.Edit]: "Editing",
  [EditorUserMode.Suggest]: "Suggesting",
  [EditorUserMode.View]: "Viewing",
};

export const editorModeIcons: Record<EditorUserModeType, ForumIconName> = {
  [EditorUserMode.Edit]: "Pencil",
  [EditorUserMode.Suggest]: "PencilSquare",
  [EditorUserMode.View]: "Eye",
};
