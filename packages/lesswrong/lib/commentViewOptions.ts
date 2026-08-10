import { isAF } from "./instanceSettings";

const getCustomViewNames = (): Partial<Record<CommentsViewName,string>> => ({
  'postCommentsMagic': 'magic (new & upvoted)',
  'postCommentsTop': 'top scoring',
  'postCommentsRecentReplies': 'latest reply',
  'afPostCommentsTop': 'top scoring',
  'postCommentsNew': 'newest',
  'postCommentsOld': 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postLWComments': 'top scoring (include LW)',
});

const getCommentsTopView = (): CommentsViewName =>
  isAF()
    ? "afPostCommentsTop"
    : "postCommentsTop";

const getDefaultViews = (): CommentsViewName[] => [
  "postCommentsMagic",
  getCommentsTopView(),
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
  ...getDefaultViews(),
  ...(options?.includeAdminViews ? adminViews : []),
  ...(isAF() ? afViews : []),
];

export const getCommentViewOptions = (
  options?: CommentViewsConfig,
): {value: CommentsViewName, label: string}[] =>
  getCommentViewNames(options).map((view) => ({
    value: view,
    label: getCustomViewNames()[view] ?? view,
  }));

export const isValidCommentView = (
  name: string,
  options?: CommentViewsConfig,
): name is CommentsViewName =>
  getCommentViewNames(options).includes(name as CommentsViewName);
