import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { hasCuratedPostsSetting } from '../../../lib/instanceSettings';
import MoveToDraftDropdownItem from "@/components/dropdowns/posts/MoveToDraftDropdownItem";
import BookmarkDropdownItem from "@/components/dropdowns/posts/BookmarkDropdownItem";
import SuggestCuratedDropdownItem from "@/components/dropdowns/posts/SuggestCuratedDropdownItem";
import SuggestAlignmentPostDropdownItem from "@/components/dropdowns/posts/SuggestAlignmentPostDropdownItem";
import ReportPostDropdownItem from "@/components/dropdowns/posts/ReportPostDropdownItem";
import DeleteDraftDropdownItem from "@/components/dropdowns/posts/DeleteDraftDropdownItem";
import SetSideItemVisibility from "@/components/dropdowns/posts/SetSideItemVisibility";
import { ResyncRssDropdownItem } from "@/components/dropdowns/posts/ResyncRssDropdownItem";
import MarkAsReadDropdownItem from "@/components/dropdowns/posts/MarkAsReadDropdownItem";
import SummarizeDropdownItem from "@/components/dropdowns/posts/SummarizeDropdownItem";
import MoveToFrontpageDropdownItem from "@/components/dropdowns/posts/MoveToFrontpageDropdownItem";
import MoveToAlignmentPostDropdownItem from "@/components/dropdowns/posts/MoveToAlignmentPostDropdownItem";
import ShortformDropdownItem from "@/components/dropdowns/posts/ShortformDropdownItem";
import DropdownMenu from "@/components/dropdowns/DropdownMenu";
import EditTagsDropdownItem from "@/components/dropdowns/posts/EditTagsDropdownItem";
import EditPostDropdownItem from "@/components/dropdowns/posts/EditPostDropdownItem";
import DuplicateEventDropdownItem from "@/components/dropdowns/posts/DuplicateEventDropdownItem";
import PostAnalyticsDropdownItem from "@/components/dropdowns/posts/PostAnalyticsDropdownItem";
import ExcludeFromRecommendationsDropdownItem from "@/components/dropdowns/posts/ExcludeFromRecommendationsDropdownItem";
import ApproveNewUserDropdownItem from "@/components/dropdowns/posts/ApproveNewUserDropdownItem";
import SharePostSubmenu from "@/components/dropdowns/posts/SharePostSubmenu";
import PostSubscriptionsDropdownItem from "@/components/dropdowns/posts/PostSubscriptionsDropdownItem";
import DislikeRecommendationDropdownItem from "@/components/dropdowns/posts/DislikeRecommendationDropdownItem";

// We use a context here vs. passing in a boolean prop because we'd need to pass
// through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false);

// Same as above context provider but for whether a post is being served as a recommendation
export const IsRecommendationContext = React.createContext<boolean>(false);

const styles = (_theme: ThemeType) => ({
  root: {
    minWidth: isFriendlyUI ? undefined : 300,
    maxWidth: "calc(100vw - 100px)",
  },
})

const PostActions = ({post, closeMenu, includeBookmark=true, classes}: {
  post: PostsList|SunshinePostsList,
  closeMenu: () => void,
  includeBookmark?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
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
      {isBookUI && <SharePostSubmenu post={post} closeMenu={closeMenu} />}
      <DuplicateEventDropdownItem post={post} />
      <PostAnalyticsDropdownItem post={post} />
      <PostSubscriptionsDropdownItem post={post} />
      {includeBookmark && <BookmarkDropdownItem post={post} />}
      <SetSideItemVisibility />
      <HideFrontpagePostDropdownItem post={post} />
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
    </DropdownMenu>
  );
}

const PostActionsComponent = registerComponent('PostActions', PostActions, {styles});

declare global {
  interface ComponentTypes {
    PostActions: typeof PostActionsComponent
  }
}

export default PostActionsComponent;
