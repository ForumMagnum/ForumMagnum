import { isFriendlyUI } from '@/themes/forumTheme';


export const getDefaultEditorPlaceholder = () => isFriendlyUI() ?
  `Highlight text to format it. Type @ to mention a user, post, or topic.` :
  `Type here! Use '/' for editor commands.`;

export const getCommentEditorPlaceholder = () => isFriendlyUI() ?
  `Write a new comment...` :
  `Type here! Use '/' for editor commands.`;

export const debateEditorPlaceholder = `Enter your first dialogue comment here, add other participants as co-authors, then save this as a draft.

Other participants will be able to participate by leaving comments on the draft, which will automatically be converted into dialogue responses.`;

export const linkpostEditorPlaceholder = `Share an excerpt, a summary, or a note about why you like the post.

You can paste the whole post if you have permission from the author, or add them as co-author in the Options below.
`;

export const questionEditorPlaceholder = `Kick off a discussion or solicit answers to something you’re confused about.`;
