import { preferredHeadingCase } from "./forumTypeUtils";
import { forumTypeSetting, isAF, isEAForum } from "./instanceSettings";

const customViewNames: Partial<Record<CommentsViewName,string>> = {
  'postCommentsMagic': isEAForum ? 'New & upvoted' : 'magic (new & upvoted)',
  'postCommentsTop': isEAForum ? 'Top' : 'top scoring',
  'postCommentsRecentReplies': preferredHeadingCase('latest reply'),
  'afPostCommentsTop': preferredHeadingCase('top scoring'),
  'postCommentsNew': isEAForum ? 'New' : 'newest',
  'postCommentsOld': isEAForum ? 'Old' : 'oldest',
  'postCommentsBest': preferredHeadingCase('highest karma'),
  'postCommentsDeleted': preferredHeadingCase('deleted'),
  'postLWComments': preferredHeadingCase('top scoring (include LW)'),
}

const commentsTopView: CommentsViewName =
  forumTypeSetting.get() === 'AlignmentForum'
    ? "afPostCommentsTop"
    : "postCommentsTop";
const defaultViews: CommentsViewName[] = [
  "postCommentsMagic",
  commentsTopView,
  "postCommentsNew",
  "postCommentsOld",
  "postCommentsRecentReplies",
];
const adminViews: CommentsViewName[] = ["postCommentsDeleted"];
const afViews: CommentsViewName[] = ["postLWComments"];

type CommentViewsConfig = {
  includeAdminViews?: boolean,
}

const getCommentViewNames = (
  options?: CommentViewsConfig,
): CommentsViewName[] => [
  ...defaultViews,
  ...(options?.includeAdminViews ? adminViews : []),
  ...(isAF ? afViews : []),
];

export const getCommentViewOptions = (
  options?: CommentViewsConfig,
): {value: CommentsViewName, label: string}[] =>
  getCommentViewNames(options).map((view) => ({
    value: view,
    label: customViewNames[view] ?? view,
  }));

export const isValidCommentView = (
  name: string,
  options?: CommentViewsConfig,
): name is CommentsViewName =>
  getCommentViewNames(options).includes(name as CommentsViewName);
