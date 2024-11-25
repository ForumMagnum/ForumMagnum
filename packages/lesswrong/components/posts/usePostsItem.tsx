import React, { useState, useCallback, useMemo } from "react";
import { useHideRepeatedPosts } from "./HideRepeatedPostsContext";
import { RecommendationOptions, useRecordPostView } from "../hooks/useRecordPostView";
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
import { AnnualReviewMarketInfo, getMarketInfo, highlightMarket } from "../../lib/collections/posts/annualReviewMarkets";
import { Link } from '../../lib/reactRouterWrapper';
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import { RECOMBEE_RECOMM_ID_QUERY_PARAM, VERTEX_ATTRIBUTION_ID_QUERY_PARAM } from "./PostsPage/PostsPage";
import { recombeeEnabledSetting, vertexEnabledSetting } from "../../lib/publicSettings";
import type { PostsListViewType } from "../hooks/usePostsListView";

const isSticky = (post: PostsList, terms: PostsViewTerms) =>
  (post && terms && terms.forum)
    ? post.sticky || (terms.af && post.afSticky) || (terms.meta && post.metaSticky)
    : false;

export type PostsItemConfig = {
  /** post: The post displayed.*/
  post: PostsListWithVotes,
  // a custom post link to override the default one
  postLink?: string,
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
  /** If the post is curated, whether to show the curation date instead of the postedAt date. Default true. */
  useCuratedDate?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  showMostValuableCheckbox?: boolean,
  viewType?: PostsListViewType,
  /** Whether or not to show interactive voting arrows */
  isVoteable?: boolean,
  recombeeRecommId?: string,
  vertexAttributionId?: string,
  /** Whether or not to make new post items have bold post item dates */
  emphasizeIfNew?: boolean,
  className?: string,
}

export type UsePostsItem = ReturnType<typeof usePostsItem>;

const areNewComments = (lastCommentedAt: Date | null, lastVisitedAt: Date | null) => {
  if (!lastCommentedAt) return false;
  if (!lastVisitedAt) return true;
  return lastVisitedAt < lastCommentedAt;
}

export const usePostsItem = ({
  post,
  postLink,
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
  viewType = "list",
  showKarma = true,
  useCuratedDate = true,
  isVoteable = false,
  recombeeRecommId,
  vertexAttributionId,
  emphasizeIfNew = false,
  className,
}: PostsItemConfig) => {
  const [showComments, setShowComments] = useState(defaultToShowComments);
  const [readComments, setReadComments] = useState(false);
  const [showDialogueMessages, setShowDialogueMessages] = useState(false);
  const {isRead, recordPostView} = useRecordPostView(post);
  const {isPostRepeated, addPost} = useHideRepeatedPosts();

  const currentUser = useCurrentUser();

  const recommendationEventOptions: RecommendationOptions = useMemo(() => ({
    recombeeOptions: { recommId: recombeeRecommId },
    vertexOptions: { attributionId: vertexAttributionId },
  }), [recombeeRecommId, vertexAttributionId]);

  const toggleComments = useCallback(
    () => {
      void recordPostView({ post, extraEventProperties: { type: "toggleComments" }, recommendationOptions: recommendationEventOptions });
      setShowComments(!showComments);
      setReadComments(true);
    },
    [post, recordPostView, setShowComments, showComments, setReadComments, recommendationEventOptions],
  );

  const toggleDialogueMessages = useCallback(
    () => {
      void recordPostView({ post, extraEventProperties: { type: "toggleDialogueMessages" }, recommendationOptions: recommendationEventOptions });
      setShowDialogueMessages(!showDialogueMessages);
    },
    [post, recordPostView, setShowDialogueMessages, showDialogueMessages, recommendationEventOptions],
  );

  const compareVisitedAndCommentedAt = (
    lastVisitedAt: Date | null,
    lastCommentedAt: Date | null,
  ) => {
    const newComments = areNewComments(lastCommentedAt, lastVisitedAt)
    return (isRead && newComments && !readComments);
  }

  const lastCommentedAt = postGetLastCommentedAt(post);
  const lastCommentPromotedAt = postGetLastCommentPromotedAt(post);
  const hasUnreadComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentedAt);
  const hadUnreadComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentedAt);
  const hasNewPromotedComments =  compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentPromotedAt);

  let newPostLink;
  if (!postLink) {
    newPostLink = post.draft && !post.debate
      ? `/editPost?${qs.stringify({
          postId: post._id,
          eventForm: post.isEvent,
        })}`
      : postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);
  } else {
    newPostLink = postLink;
  }

  if (recombeeRecommId && recombeeEnabledSetting.get()) {
    newPostLink = `${newPostLink}?${RECOMBEE_RECOMM_ID_QUERY_PARAM}=${recombeeRecommId}`
    // These shouldn't ever both be present at the same time
  } else if (vertexAttributionId && vertexEnabledSetting.get()) {
    newPostLink = `${newPostLink}?${VERTEX_ATTRIBUTION_ID_QUERY_PARAM}=${vertexAttributionId}`
  }

  const showDismissButton = Boolean(currentUser && resumeReading);
  const onArchive = toggleDeleteDraft && (() => toggleDeleteDraft(post));
  const showArchiveButton = Boolean(currentUser && post.draft && postCanDelete(currentUser, post) && onArchive);

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
    viewType,
  };

  const annualReviewMarketInfo = getMarketInfo(post)

  const isRecommendation = !!recombeeRecommId || !!vertexAttributionId;

  return {
    post,
    postLink: newPostLink,
    commentsLink: newPostLink + "#comments",
    commentCount: postGetCommentCount(post),
    primaryTag: hideTag ? null : postGetPrimaryTag(post),
    tagRel,
    resumeReading,
    sticky: forceSticky || isSticky(post, terms),
    renderComments: showComments || (defaultToShowUnreadComments && hadUnreadComments),
    renderDialogueMessages: showDialogueMessages,
    condensedAndHiddenComments: defaultToShowUnreadComments && !showComments,
    toggleComments,
    toggleDialogueMessages,
    showAuthor: !post.isEvent && !hideAuthor,
    showDate: showPostedAt && !resumeReading,
    showTrailingButtons: !hideTrailingButtons,
    showMostValuableCheckbox,
    showNominationCount,
    showReviewCount,
    showIcons,
    showKarma,
    useCuratedDate,
    hideTag,
    annualReviewMarketInfo,
    showReadCheckbox,
    showDraftTag,
    showPersonalIcon,
    showBottomBorder,
    showDismissButton,
    showArchiveButton,
    onDismiss: dismissRecommendation,
    onArchive,
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
    viewType,
    bookmark,
    isVoteable,
    isRecommendation,
    emphasizeIfNew,
    className,
  };
}
