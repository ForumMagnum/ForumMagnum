
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
  moderatedCommentId?: string
}
