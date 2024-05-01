import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useCurrentUser } from '../../common/withUser';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { hasCuratedPostsSetting } from '../../../lib/instanceSettings';

// We use a context here vs. passing in a boolean prop because we'd need to pass
// through ~4 layers of hierarchy
export const AllowHidingFrontPagePostsContext = React.createContext<boolean>(false);

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
    minWidth: isFriendlyUI ? undefined : 300,
    maxWidth: "calc(100vw - 100px)",
  },
})

const PostActions = ({post, closeMenu, includeBookmark=true, classes}: {
  post: PostsList|SunshinePostsList,
  closeMenu: () => void,
  includeBookmark?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();

  const {
    MoveToDraftDropdownItem, BookmarkDropdownItem, SuggestCuratedDropdownItem,
    SuggestAlignmentPostDropdownItem, ReportPostDropdownItem, DeleteDraftDropdownItem,
    HideFrontpagePostDropdownItem, SetSideCommentVisibility, ResyncRssDropdownItem,
    MarkAsReadDropdownItem, SummarizeDropdownItem, MoveToFrontpageDropdownItem,
    MoveToAlignmentPostDropdownItem, ShortformDropdownItem, DropdownMenu,
    EditTagsDropdownItem, EditPostDropdownItem, DuplicateEventDropdownItem,
    PostAnalyticsDropdownItem, ExcludeFromRecommendationsDropdownItem,
    ApproveNewUserDropdownItem, SharePostSubmenu, PostSubscriptionsDropdownItem,
  } = Components;

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
      <SetSideCommentVisibility />
      <HideFrontpagePostDropdownItem post={post} />
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
