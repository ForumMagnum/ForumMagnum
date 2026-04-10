import type { EditorTypeString } from '@/components/editor/Editor';


export const getDefaultEditorPlaceholder = (editorType: EditorTypeString = 'lexical') => {
  switch (editorType) {
    case 'lexical':
      return `Type here! Use '/' for editor commands.`;
    case 'markdown':
      return 'Markdown editor enabled.  If you want to use our new editor, go to https://www.lesswrong.com/account?tab=preferences and disable "Use Markdown editor".';
    default:
      return `If you want to use our new editor, go to https://www.lesswrong.com/account?tab=preferences and disable "Use Markdown editor".`;
  }
};

export const getCommentEditorPlaceholder = (editorType: EditorTypeString) => {
  switch (editorType) {
    case 'lexical':
      return `Type here! Use '/' for editor commands.`;
    case 'markdown':
      return 'Markdown editor enabled.  If you want to use our new editor, go to https://www.lesswrong.com/account?tab=preferences and disable "Use Markdown editor".';
    default:
      return `If you want to use our new editor, go to https://www.lesswrong.com/account?tab=preferences and disable "Use Markdown editor".`;
  }
};

export const debateEditorPlaceholder = `Enter your first dialogue comment here, add other participants as co-authors, then save this as a draft.

Other participants will be able to participate by leaving comments on the draft, which will automatically be converted into dialogue responses.`;

export const linkpostEditorPlaceholder = `Share an excerpt, a summary, or a note about why you like the post.

You can paste the whole post if you have permission from the author, or add them as co-author in the Options below.
`;

export const questionEditorPlaceholder = `Kick off a discussion or solicit answers to something you’re confused about.`;
