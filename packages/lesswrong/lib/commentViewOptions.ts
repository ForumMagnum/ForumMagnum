import { isFriendlyUI } from "../themes/forumTheme";
import type { ForumTypeString } from "./instanceSettings";

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

const getCommentsTopView = (forumType: ForumTypeString): CommentsViewName =>
  forumType === 'AlignmentForum'
    ? "afPostCommentsTop"
    : "postCommentsTop";

const getDefaultViews = (forumType: ForumTypeString): CommentsViewName[] => [
  "postCommentsMagic",
  getCommentsTopView(forumType),
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
  forumType: ForumTypeString,
  options?: CommentViewsConfig,
): CommentsViewName[] => [
  ...getDefaultViews(forumType),
  ...(options?.includeAdminViews ? adminViews : []),
  ...(forumType === 'AlignmentForum' ? afViews : []),
];

export const getCommentViewOptions = (
  forumType: ForumTypeString,
  options?: CommentViewsConfig,
): {value: CommentsViewName, label: string}[] =>
  getCommentViewNames(forumType, options).map((view) => ({
    value: view,
    label: getCustomViewNames()[view] ?? view,
  }));

export const isValidCommentView = (
  name: string,
  forumType: ForumTypeString,
  options?: CommentViewsConfig,
): name is CommentsViewName =>
  getCommentViewNames(forumType, options).includes(name as CommentsViewName);
