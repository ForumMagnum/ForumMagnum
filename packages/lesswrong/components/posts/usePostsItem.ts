import { useState, useCallback } from "react";
import { useHideRepeatedPosts } from "./HideRepeatedPostsContext";
import { useRecordPostView } from "../hooks/useRecordPostView";
import { useCurrentUser } from "../common/withUser";
import {
  postCanDelete,
  postGetCommentCount,
  postGetLastCommentedAt,
  postGetLastCommentPromotedAt,
  postGetPageUrl,
  postGetPrimaryTag,
} from "../../lib/collections/posts/helpers";
import qs from "qs";
import type { PopperPlacementType } from "@material-ui/core/Popper"

const isSticky = (post: PostsList, terms: PostsViewTerms) =>
  (post && terms && terms.forum)
    ? post.sticky || (terms.af && post.afSticky) || (terms.meta && post.metaSticky)
    : false;

export type PostsItemConfig = {
  /** post: The post displayed.*/
  post: PostsListWithVotes,
  /** tagRel: (Optional) The relationship between this post and a tag. If
  /* provided, UI will be shown with the score and voting on this post's
  /* relevance to that tag.*/
  tagRel?: WithVoteTagRel|null,
  /** defaultToShowComments: (bool) If set, comments will be expanded by default.*/
  defaultToShowComments?: boolean,
  /** sequenceId, chapter: If set, these will be used for making a nicer URL.*/
  sequenceId?: string,
  chapter?: any,
  /** index: If this is part of a list of PostsItems, its index (starting from
  /* zero) into that list. Used for special casing some styling at start of
  /* the list.*/
  index?: number,
  /**
   * terms: If this is part of a list generated from a query, the terms of that
   * query. Used for figuring out which sticky icons to apply, if any.
   */
  terms?: any,
  /** resumeReading: If this is a Resume Reading suggestion, the corresponding
  /* partiallyReadSequenceItem (see schema in users/schema). Used for
  /* the sequence-image background.*/
  resumeReading?: any,
  /** dismissRecommendation: If this is a Resume Reading suggestion, a callback to dismiss it.*/
  dismissRecommendation?: any,
  /** if this a draft, a callback to archive/unarchive it */
  toggleDeleteDraft?: (post: PostsList) => void,
  showBottomBorder?: boolean,
  showDraftTag?: boolean,
  showPersonalIcon?: boolean
  showIcons?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  /** dense: (bool) Slightly reduce margins to make this denser. Used on the AllPosts page.*/
  dense?: boolean,
  /** bookmark: (bool) Whether this is a bookmark. Adds a clickable bookmark icon.*/
  bookmark?: boolean,
  /** showNominationCount: (bool) whether this should display it's number of Review nominations*/
  showNominationCount?: boolean,
  showReviewCount?: boolean,
  /** hideAuthor: hide the post author. Used on user-profile pages
   * where there's a list of posts all by the same author, to avoid the redundancy. */
  hideAuthor?: boolean,
  hideTag?: boolean,
  hideTrailingButtons?: boolean,
  tooltipPlacement?: PopperPlacementType,
  curatedIconLeft?: boolean,
  strikethroughTitle?: boolean,
  translucentBackground?: boolean,
  forceSticky?: boolean,
  showReadCheckbox?: boolean,
  showKarma?: boolean,
  showMostValuableCheckbox?: boolean,
}

export type UsePostsItem = ReturnType<typeof usePostsItem>;

export const usePostsItem = ({
  post,
  tagRel = null,
  defaultToShowComments = false,
  sequenceId,
  chapter,
  terms,
  resumeReading,
  dismissRecommendation,
  toggleDeleteDraft,
  showBottomBorder = true,
  showDraftTag = true,
  showPersonalIcon = true,
  showIcons = true,
  showPostedAt = true,
  defaultToShowUnreadComments = false,
  dense = false,
  bookmark = false,
  showNominationCount = false,
  showReviewCount = false,
  hideAuthor = false,
  hideTag = false,
  hideTrailingButtons = false,
  tooltipPlacement = "bottom-end",
  curatedIconLeft = false,
  strikethroughTitle = false,
  translucentBackground = false,
  forceSticky = false,
  showReadCheckbox = false,
  showMostValuableCheckbox = false,
  showKarma = true
}: PostsItemConfig) => {
  const [showComments, setShowComments] = useState(defaultToShowComments);
  const [readComments, setReadComments] = useState(false);
  const {isRead, recordPostView} = useRecordPostView(post);
  const {isPostRepeated, addPost} = useHideRepeatedPosts();

  const currentUser = useCurrentUser();

  const toggleComments = useCallback(
    (e: MouseEvent) => {
      recordPostView({post, extraEventProperties: {type: "toggleComments"}})
      setShowComments(!showComments);
      setReadComments(true);
      e.stopPropagation();
    },
    [post, recordPostView, setShowComments, showComments, setReadComments],
  );

  const compareVisitedAndCommentedAt = (
    lastVisitedAt: Date,
    lastCommentedAt: Date | null,
  ) => {
    const newComments = lastCommentedAt ? lastVisitedAt < lastCommentedAt : false;
    return (isRead && newComments && !readComments);
  }

  const lastCommentedAt = postGetLastCommentedAt(post);
  const lastCommentPromotedAt = postGetLastCommentPromotedAt(post);
  const hasUnreadComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentedAt);
  const hadUnreadComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentedAt);
  const hasNewPromotedComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentPromotedAt);

  const postLink = post.draft && !post.debate
    ? `/editPost?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`
    : postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);

  const showDismissButton = Boolean(currentUser && resumeReading);
  const showArchiveButton = Boolean(currentUser && post.draft && postCanDelete(currentUser, post));

  const commentTerms: CommentsViewTerms = {
    view: "postsItemComments",
    limit:7,
    postId: post._id,
    after: (defaultToShowUnreadComments && !showComments) ? post.lastVisitedAt : null
  }

  const isRepeated = isPostRepeated(post._id);
  if (!isRepeated) {
    addPost(post._id);
  }

  const analyticsProps = {
    pageElementContext: "postItem",
    postId: post._id,
    isSticky: isSticky(post, terms),
  };

  return {
    post,
    postLink,
    commentsLink: postLink + "#comments",
    commentCount: postGetCommentCount(post),
    primaryTag: hideTag ? null : postGetPrimaryTag(post),
    tagRel,
    resumeReading,
    sticky: forceSticky || isSticky(post, terms),
    renderComments: showComments || (defaultToShowUnreadComments && hadUnreadComments),
    condensedAndHiddenComments: defaultToShowUnreadComments && !showComments,
    toggleComments,
    showAuthor: !post.isEvent && !hideAuthor,
    showDate: showPostedAt && !resumeReading,
    showTrailingButtons: !hideTrailingButtons,
    showMostValuableCheckbox,
    showNominationCount,
    showReviewCount,
    showIcons,
    showKarma,
    showReadCheckbox,
    showDraftTag,
    showPersonalIcon,
    showBottomBorder,
    showDismissButton,
    showArchiveButton,
    onDismiss: dismissRecommendation,
    onArchive: toggleDeleteDraft?.bind(null, post),
    hasUnreadComments,
    hasNewPromotedComments,
    commentTerms,
    isRepeated,
    analyticsProps,
    translucentBackground,
    isRead,
    tooltipPlacement,
    dense,
    curatedIconLeft,
    strikethroughTitle,
    bookmark,
  };
}
