import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import { useCurrentUser } from '../../common/withUser';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { hasCuratedPostsSetting } from '../../../lib/instanceSettings';
import MoveToDraftDropdownItem from "./MoveToDraftDropdownItem";
import BookmarkDropdownItem from "./BookmarkDropdownItem";
import SuggestCuratedDropdownItem from "./SuggestCuratedDropdownItem";
import SuggestAlignmentPostDropdownItem from "./SuggestAlignmentPostDropdownItem";
import ReportPostDropdownItem from "./ReportPostDropdownItem";
import DeleteDraftDropdownItem from "./DeleteDraftDropdownItem";
import SetSideItemVisibility from "./SetSideItemVisibility";
import { ResyncRssDropdownItem } from "./ResyncRssDropdownItem";
import MarkAsReadDropdownItem from "./MarkAsReadDropdownItem";
import SummarizeDropdownItem from "./SummarizeDropdownItem";
import MoveToFrontpageDropdownItem from "./MoveToFrontpageDropdownItem";
import MoveToAlignmentPostDropdownItem from "./MoveToAlignmentPostDropdownItem";
import ShortformDropdownItem from "./ShortformDropdownItem";
import DropdownMenu from "../DropdownMenu";
import EditTagsDropdownItem from "./EditTagsDropdownItem";
import EditPostDropdownItem from "./EditPostDropdownItem";
import DuplicateEventDropdownItem from "./DuplicateEventDropdownItem";
import PostAnalyticsDropdownItem from "./PostAnalyticsDropdownItem";
import ExcludeFromRecommendationsDropdownItem from "./ExcludeFromRecommendationsDropdownItem";
import ApproveNewUserDropdownItem from "./ApproveNewUserDropdownItem";
import SharePostSubmenu from "./SharePostSubmenu";
import { PostSubscriptionsDropdownItem } from "./PostSubscriptionsDropdownItem";
import DislikeRecommendationDropdownItem from "./DislikeRecommendationDropdownItem";
import HideFrontPageButton from './HideFrontpagePostDropdownItem';

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
    </DropdownMenu>
  );
}

export default registerComponent('PostActions', PostActions, {styles});


