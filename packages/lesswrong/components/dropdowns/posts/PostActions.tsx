import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import React from 'react';
import { hasCuratedPostsSetting } from '../../../lib/instanceSettings';
import { useCurrentUser } from '../../common/withUser';
import DropdownMenu from "../DropdownMenu";
import ApproveNewUserDropdownItem from "./ApproveNewUserDropdownItem";
import BookmarkDropdownItem from "./BookmarkDropdownItem";
import DeleteDraftDropdownItem from "./DeleteDraftDropdownItem";
import DislikeRecommendationDropdownItem from "./DislikeRecommendationDropdownItem";
import DuplicateEventDropdownItem from "./DuplicateEventDropdownItem";
import EditPostDropdownItem from "./EditPostDropdownItem";
import EditTagsDropdownItem from "./EditTagsDropdownItem";
import ExcludeFromRecommendationsDropdownItem from "./ExcludeFromRecommendationsDropdownItem";
import HideFrontPageButton from './HideFrontpagePostDropdownItem';
import LLMScoreDropdownItem from "./LLMScoreDropdownItem";
import LlmPolicyViolationDropdownItem from "./LlmPolicyViolationDropdownItem";
import MarkAsReadDropdownItem from "./MarkAsReadDropdownItem";
import MoveToAlignmentPostDropdownItem from "./MoveToAlignmentPostDropdownItem";
import MoveToDraftDropdownItem from "./MoveToDraftDropdownItem";
import MoveToFrontpageDropdownItem from "./MoveToFrontpageDropdownItem";
import PostAnalyticsDropdownItem from "./PostAnalyticsDropdownItem";
import { PostSubscriptionsDropdownItem } from "./PostSubscriptionsDropdownItem";
import ReportPostDropdownItem from "./ReportPostDropdownItem";
import { ResyncRssDropdownItem } from "./ResyncRssDropdownItem";
import SetSideItemVisibility from "./SetSideItemVisibility";
import ShortformDropdownItem from "./ShortformDropdownItem";
import SuggestAlignmentPostDropdownItem from "./SuggestAlignmentPostDropdownItem";
import SuggestCuratedDropdownItem from "./SuggestCuratedDropdownItem";
import SummarizeDropdownItem from "./SummarizeDropdownItem";

// We use a context here vs. passing in a boolean prop because we'd need to pass
// through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false);

// Same as above context provider but for whether a post is being served as a recommendation
export const IsRecommendationContext = React.createContext<boolean>(false);

const styles = defineStyles("PostActions", (theme: ThemeType) => ({
  root: {
    minWidth: 300,
    maxWidth: "calc(100vw - 100px)",
  },
}))

const PostActions = ({post, closeMenu, includeBookmark=true}: {
  post: PostsList|SunshinePostsList,
  closeMenu: () => void,
  includeBookmark?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!post) return null;

  // WARNING: Clickable items in this menu must be full-width, and
  // ideally should use the <DropdownItem> component. In particular,
  // do NOT wrap a <MenuItem> around something that has its own
  // onClick handler; the onClick handler should either be on the
  // MenuItem, or on something outside of it. Putting an onClick
  // on an element inside of a MenuItem can create a dead-space
  // click area to the right of the item which looks like you've
  // selected the thing, and closes the menu, but doesn't do the
  // thing.

  return (
    <DropdownMenu className={classes.root} >
      <EditPostDropdownItem post={post} />
      <ResyncRssDropdownItem post={post} closeMenu={closeMenu} />
      <DuplicateEventDropdownItem post={post} />
      <PostAnalyticsDropdownItem post={post} />
      <PostSubscriptionsDropdownItem post={post} />
      {includeBookmark && <BookmarkDropdownItem documentId={post._id} collectionName="Posts" />}
      <SetSideItemVisibility />
      <HideFrontPageButton post={post} />
      <DislikeRecommendationDropdownItem post={post} />
      <ReportPostDropdownItem post={post}/>
      {currentUser && <EditTagsDropdownItem post={post} closeMenu={closeMenu} />}
      <SummarizeDropdownItem post={post} closeMenu={closeMenu} />
      {currentUser && <MarkAsReadDropdownItem post={post} />}
      {hasCuratedPostsSetting.get() && <SuggestCuratedDropdownItem post={post} />}
      <MoveToDraftDropdownItem post={post} />
      <DeleteDraftDropdownItem post={post} />
      <MoveToFrontpageDropdownItem post={post} />
      <ShortformDropdownItem post={post} />
      <ExcludeFromRecommendationsDropdownItem post={post} />
      <ApproveNewUserDropdownItem post={post} />
      <SuggestAlignmentPostDropdownItem post={post}/>
      <MoveToAlignmentPostDropdownItem post={post}/>
      <LlmPolicyViolationDropdownItem post={post} closeMenu={closeMenu} />
      <LLMScoreDropdownItem post={post} closeMenu={closeMenu} />
    </DropdownMenu>
  );
}

export default PostActions;


