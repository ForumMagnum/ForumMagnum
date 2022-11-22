
export interface CommentTreeOptions {
  postPage?: boolean,
  lastCommentId?: string,
  markAsRead?: any,
  highlightDate?: Date,
  condensed?: boolean,
  refetch?: any,
  scrollOnExpand?: boolean,
  hideSingleLineMeta?: boolean,
  enableHoverPreview?: boolean,
  singleLineCollapse?: boolean,
  hideReply?: boolean,
  showPostTitle?: boolean,
  singleLinePostTitle?: boolean,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  hideReviewVoteButtons?: boolean,
  /**
   * Which comment in the tree is moderated, if any.
   * For custom styling in the comment moderation tab.
   */
  moderatedCommentId?: string,
  refetchAfterApproval?: () => Promise<void>,
  /**
   * If the top-level comment has a comment approval status, child comments also need to know.
   * 
   * Note that in contexts like `PostsItemNewCommentsWrapper` we need to separately fetch the top-level comments,
   * because it fetches a very small number of comments and those often won't include the top-level comment for any given thread
   */
  rootCommentApproval?: CommentApprovalWithoutComment
}
