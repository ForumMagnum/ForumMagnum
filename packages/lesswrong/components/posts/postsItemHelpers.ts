import qs from "qs";
import type { Placement as PopperPlacementType } from "popper.js";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import type { AnnualReviewMarketInfo } from "../../lib/collections/posts/annualReviewMarkets";
import { RECOMBEE_RECOMM_ID_QUERY_PARAM } from "./PostsPage/constants";
import { recombeeEnabledSetting } from "@/lib/instanceSettings";
import type { PostsListViewType } from "../hooks/usePostsListView";

const isSticky = (post: PostsList, terms?: PostsViewTerms) =>
  (post && terms && terms.forum)
    ? post.sticky || (terms.af && post.afSticky) || (terms.meta && post.metaSticky)
    : false;

export type PostsItemConfig = {
  post: PostsListWithVotes,
  tagRel?: WithVoteTagRel | null,
  defaultToShowComments?: boolean,
  sequenceId?: string,
  chapter?: any,
  index?: number,
  terms?: PostsViewTerms,
  resumeReading?: any,
  dismissRecommendation?: any,
  toggleDeleteDraft?: (post: PostsList) => void,
  showBottomBorder?: boolean,
  showDraftTag?: boolean,
  showPersonalIcon?: boolean,
  showIcons?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  showCommentsIcon?: boolean,
  dense?: boolean,
  bookmark?: boolean,
  showNominationCount?: boolean,
  showReviewCount?: boolean,
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
  useCuratedDate?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  showMostValuableCheckbox?: boolean,
  viewType?: PostsListViewType,
  isVoteable?: boolean,
  recombeeRecommId?: string,
  emphasizeIfNew?: boolean,
  className?: string,
};

export const hasUnreadPostItemComments = (
  lastCommentedAt: Date | null,
  lastVisitedAt: Date | null,
) => {
  if (!lastCommentedAt) return false;
  if (!lastVisitedAt) return true;
  return lastVisitedAt < lastCommentedAt;
};

export const getPostItemCommentTerms = ({
  post,
  defaultToShowUnreadComments = false,
  showComments = false,
}: {
  post: Pick<PostsListWithVotes, "_id" | "lastVisitedAt">,
  defaultToShowUnreadComments?: boolean,
  showComments?: boolean,
}): CommentsViewTerms => ({
  view: "postsItemComments",
  limit: 7,
  postId: post._id,
  after: (defaultToShowUnreadComments && !showComments) ? post.lastVisitedAt : null,
});

export const getPostItemLink = ({
  post,
  sequenceId,
  chapter,
  recombeeRecommId,
}: {
  post: Pick<PostsListWithVotes, "_id"|"slug"|"draft"|"debate"|"isEvent">,
  sequenceId?: string,
  chapter?: { sequenceId?: string },
  recombeeRecommId?: string,
}) => {
  let postLink = post.draft && !post.debate
    ? `/editPost?${qs.stringify({ postId: post._id, eventForm: post.isEvent })}`
    : postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);

  if (recombeeRecommId && recombeeEnabledSetting.get()) {
    postLink = `${postLink}?${RECOMBEE_RECOMM_ID_QUERY_PARAM}=${recombeeRecommId}`;
  }

  return postLink;
};

export const isStickyPostItem = (post: PostsList, terms?: PostsViewTerms) =>
  isSticky(post, terms);
