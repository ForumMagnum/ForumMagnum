import type { ReactNode } from 'react';
import type { FormDisplayMode } from './CommentsNewForm';

export interface CommentTreeOptions {
  /**
   * If a comment-tree is replies to a post, that post. (But note that
   * this being missing does not guarantee that a comment is not
   * associated with a post, if the origin of the comments is something
   * else, eg the comment history on a user profile page.)
   */
  post?: PostsMinimumInfo,
  /**
   * If a comment-tree is replies to a tag, that tag. (But note that
   * this can be unpopulated in some contexts, as with the post field).
   */
  tag?: TagBasicInfo,
  
  /**
   * In theory, `postPage` is a flag that indicates whether this comment
   * tree is being shown on a post page. However it appears to be being
   * (ab)used in other contexts as well. TODO: Reverse-engineer this.
   */
  postPage?: boolean,
  
  /**
   * Whether to show a [-] button in the top-left of each comment. (Note
   * the distinction between this collapsing mechanism, and single-line
   * comments; these are separate.)
   */
  showCollapseButtons?: boolean,

  /**
   * Called when a comment is collapsed or expanded (by clicking the little icon by the author's name)
   */
  onToggleCollapsed?: () => void,

  /**
   * In certain special contexts, the ID of the most recent comment in
   * the tree. Usually omitted; when present, this makes the most recent
   * comment a special case for read-more/single-line truncation.
   */
  lastCommentId?: string,
  
  /**
   * If passed, comments are highlighted (with a bar on the left edge)
   * if they're newer than this date.
   */
  highlightDate?: Date,
  
  /**
   * If passed, comments are more likely to start out collapsed into
   * single-line mode.
   */
  condensed?: boolean,
  
  /**
   * Refetch whatever query generated this comment tree. Called after
   * replying to or editing a comment..
   */
  refetch?: () => void,
  
  /**
   * If passed, expanding this comment (from single-line or truncated)
   * will also scroll it into view. Seems to only be used in recent
   * discussion.
   */
  scrollOnExpand?: boolean,
  
  /**
   * If a comment is collapsed to single-line mode, hide its date and
   * nomination/review/etc type.
   */
  hideSingleLineMeta?: boolean,
  
  /**
   * Whether comments have a hover-preview when collapsed to single-line
   * mode. (Default true).
   */
  enableHoverPreview?: boolean,
  
  /**
   * If passed, a [-] button will be added which shrinks the comment to
   * single line. Mutually exclusive with showCollapseButtons.
   */
  singleLineCollapse?: boolean,
  
  /**
   * If passed, the Reply link will be hidden from the bottom of
   * comments.
   */
  hideReply?: boolean,
  
  /**
   * If passed, the comment will have a link to the post or tag it
   * appears on (if available) in its top metadata line.
   */
  showPostTitle?: boolean,
  
  /**
   * If passed, when comments are collapsed to single line they will
   * include the title of the post that they're on.
   */
  singleLinePostTitle?: boolean,
  
  /**
   * If passed, comments that are part of the yearly review will
   * nevertheless not have review-voting UI attached.
   */
  hideReviewVoteButtons?: boolean,
  
  /**
   * If passed, all comments in the tree will start out as single-line
   * comments. (This takes precedence over forceNotSingleLine). Used for
   * shortform comments on the All Posts page, and in the yearly review.
   */
  forceSingleLine?: boolean,
  
  /**
   * If passed, never start comments collapsed to single line.
   */
  forceNotSingleLine?: boolean,

  /**
   * If passed, expand all comments in the tree whose IDs are in the set (and only those comments).
   * This takes precedence over both `forceSingleLine` and `forceNotSingleLine`.
   */
  expandOnlyCommentIds?: Set<string>,
  
  /**
   * By default, every comment has its comment ID added to the DOM as an
   * element ID, to enable within-page linking. If passed, skip those
   * IDs (eg because the same comment would appear in the page more than
   * once and this isn't the one you want to link to.)
   */
  noDOMId?: boolean,
  
  /**
   * "default" | "minimalist" . If "minimalist", overrides the style of the reply button
   * and reply form to be more like a chat interface.
   */
  formStyle?: FormDisplayMode,
  
  /**
   * If provided, Reply buttons are replaced with something else. Used
   * in side-comments, to replace Reply with See In Context.
   */
  replaceReplyButtonsWith?: (comment: CommentsList|CommentsListWithParentMetadata,) => ReactNode
  
  /**
   * Which comment in the tree is moderated, if any.
   * For custom styling in the comment moderation tab.
   */
  moderatedCommentId?: string
  
  /**
   * If set, this is a side-comment (ie, is being shown in the right
   * margin).
   */
  isSideComment?: boolean,
  
  /**
   * If set, remove the actions menu (the triple-dot icon in the
   * top-right corner) from each comment. Used for side-comments where
   * space is tight.
   */
  hideActionsMenu?: boolean,
  /**
   * If set, hide the `ShowParentComment` toggle
   * Used for displaying inline replies to debate comments
   */
  hideParentCommentToggle?: boolean,
  /**
   * If set, hide the `ShowParentComment` toggle when we reach the top level comment
   * Used to prevent us displaying quick takes multiple times
   */
  hideParentCommentToggleForTopLevel?: boolean,
  
  /**
   * Comments have backgrounds in alternating colors, depending whether their
   * nesting level is even or odd. If set, toggle which nesting level gets which
   * background.
   */
  switchAlternatingHighlights?: boolean,

  /**
   * Apply styling to deemphasize comments written by users with any userId not in the provided set
   */
  deemphasizeCommentsExcludingUserIds?: Set<string>,

  /**
   * If set, start in the editing state
   */
  initialShowEdit?: boolean,

  /**
   * If set, CommentBottom shows an "Edit in context" link. If followed this takes the user to a prefilled edit
   * box in the context their comment will appear.
   */
  showEditInContext?: boolean,
}
