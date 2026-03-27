import { isFriendlyUI } from "../themes/forumTheme";
import { type ForumTypeString } from "./instanceSettings";

const getCustomViewNames = (): Partial<Record<CommentsViewName,string>> => ({
  'postCommentsMagic': isFriendlyUI() ? 'New & upvoted' : 'magic (new & upvoted)',
  'postCommentsTop': isFriendlyUI() ? 'Top' : 'top scoring',
  'postCommentsRecentReplies': 'latest reply',
  'afPostCommentsTop': 'top scoring',
  'postCommentsNew': isFriendlyUI() ? 'New' : 'newest',
  'postCommentsOld': isFriendlyUI() ? 'Old' : 'oldest',
  'postCommentsBest': 'highest karma',
  'postCommentsDeleted': 'deleted',
  'postLWComments': 'top scoring (include LW)',
});

const getCommentsTopView = (options: CommentViewsConfig): CommentsViewName =>
  (options.forumType === "AlignmentForum")
    ? "afPostCommentsTop"
    : "postCommentsTop";

const getDefaultViews = (options: CommentViewsConfig): CommentsViewName[] => [
  "postCommentsMagic",
  getCommentsTopView(options),
  "postCommentsNew",
  "postCommentsOld",
  "postCommentsRecentReplies",
];
const adminViews: CommentsViewName[] = ["postCommentsDeleted"];
const afViews: CommentsViewName[] = ["postLWComments"];

type CommentViewsConfig = {
  forumType: ForumTypeString,
  includeAdminViews?: boolean,
}

const getCommentViewNames = (
  options: CommentViewsConfig,
): CommentsViewName[] => [
  ...getDefaultViews(options),
  ...(options?.includeAdminViews ? adminViews : []),
  ...(options.forumType === "AlignmentForum" ? afViews : []),
];

export const getCommentViewOptions = (
  options: CommentViewsConfig,
): {value: CommentsViewName, label: string}[] =>
  getCommentViewNames(options).map((view) => ({
    value: view,
    label: getCustomViewNames()[view] ?? view,
  }));

export const isValidCommentView = (
  name: string,
  options: CommentViewsConfig,
): name is CommentsViewName =>
  getCommentViewNames(options).includes(name as CommentsViewName);
