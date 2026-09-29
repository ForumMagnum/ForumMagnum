import { useForumType } from '@/components/hooks/useForumType';
import React from 'react';
import { useCurrentUser } from '../../common/withUser';
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
import MoveToFrontpageDropdownItem from "./MoveToFrontpageDropdownItem";
import MoveToAlignmentPostDropdownItem from "./MoveToAlignmentPostDropdownItem";
import ShortformDropdownItem from "./ShortformDropdownItem";
import DropdownMenu from "../DropdownMenu";
import CopyMarkdownDropdownItem from "../CopyMarkdownDropdownItem";
import EditTagsDropdownItem from "./EditTagsDropdownItem";
import EditPostDropdownItem from "./EditPostDropdownItem";
import DuplicateEventDropdownItem from "./DuplicateEventDropdownItem";
import PostAnalyticsDropdownItem from "./PostAnalyticsDropdownItem";
import ExcludeFromRecommendationsDropdownItem from "./ExcludeFromRecommendationsDropdownItem";
import ApproveNewUserDropdownItem from "./ApproveNewUserDropdownItem";
import { PostSubscriptionsDropdownItem } from "./PostSubscriptionsDropdownItem";
import DislikeRecommendationDropdownItem from "./DislikeRecommendationDropdownItem";
import HideFrontPageButton from './HideFrontpagePostDropdownItem';
import LLMScoreDropdownItem from "./LLMScoreDropdownItem";
import LlmPolicyViolationDropdownItem from "./LlmPolicyViolationDropdownItem";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import { userIsAdminOrMod } from '@/lib/vulcan-users/permissions';
import { canUserEditPostMetadataWithoutModeratorPowers } from '@/lib/collections/posts/helpers';
import { Paper } from '@/components/widgets/Paper';
import LWTooltip from "../../common/LWTooltip";
import DropdownItem from "../DropdownItem";

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
  moderatorSubmenu: {
    minWidth: 250,
  },
}))

/**
 * A menu item which, when hovered, opens a submenu containing actions that
 * are only available because the current user is a moderator or admin. This
 * keeps them separate from the actions that regular users see.
 */
const ModeratorActionsSubmenu = ({children}: {
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  return <LWTooltip
    title={<Paper className={classes.moderatorSubmenu}>{children}</Paper>}
    tooltip={false}
    clickable
    inlineBlock={false}
    placement="left-start"
  >
    <DropdownItem title="Moderator actions" icon="Settings" />
  </LWTooltip>
}

const PostActions = ({post, closeMenu, includeBookmark=true}: {
  post: PostsList|SunshinePostsList,
  closeMenu: () => void,
  includeBookmark?: boolean,
}) => {
  const { forumType } = useForumType();
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

  // Moderators and admins see moderator-only actions grouped into a submenu,
  // so that it's clear which items in the menu regular users would see. This
  // includes actions that regular users can take on their own posts (like
  // editing or moving to drafts), if the current user can only take them on
  // this post because they're a moderator.
  const showModeratorSubmenu = userIsAdminOrMod(currentUser);
  const editActionsAreModeratorOnly = showModeratorSubmenu
    && !canUserEditPostMetadataWithoutModeratorPowers(currentUser, post);

  const editItems = <>
    <EditPostDropdownItem post={post} />
    <ResyncRssDropdownItem post={post} closeMenu={closeMenu} />
    <DuplicateEventDropdownItem post={post} />
  </>;
  const moveToDraftItem = <MoveToDraftDropdownItem post={post} />;

  const moderatorItems = <>
    {editActionsAreModeratorOnly && editItems}
    {editActionsAreModeratorOnly && moveToDraftItem}
    {hasCuratedPostsSetting.get(forumType) && <SuggestCuratedDropdownItem post={post} />}
    <MoveToFrontpageDropdownItem post={post} />
    <ShortformDropdownItem post={post} />
    <ExcludeFromRecommendationsDropdownItem post={post} />
    <ApproveNewUserDropdownItem post={post} />
    <SuggestAlignmentPostDropdownItem post={post}/>
    <MoveToAlignmentPostDropdownItem post={post}/>
    <LlmPolicyViolationDropdownItem post={post} closeMenu={closeMenu} />
    <LLMScoreDropdownItem post={post} closeMenu={closeMenu} />
  </>;

  return (
    <DropdownMenu className={classes.root} >
      {!editActionsAreModeratorOnly && editItems}
      <PostAnalyticsDropdownItem post={post} />
      <PostSubscriptionsDropdownItem post={post} />
      {includeBookmark && <BookmarkDropdownItem documentId={post._id} collectionName="Posts" />}
      <SetSideItemVisibility />
      <HideFrontPageButton post={post} />
      <DislikeRecommendationDropdownItem post={post} />
      <ReportPostDropdownItem post={post}/>
      {currentUser && <EditTagsDropdownItem post={post} closeMenu={closeMenu} />}
      <CopyMarkdownDropdownItem path={`/api/post/${post._id}`} />
      {currentUser && <MarkAsReadDropdownItem post={post} />}
      {!editActionsAreModeratorOnly && moveToDraftItem}
      <DeleteDraftDropdownItem post={post} />
      {showModeratorSubmenu
        ? <ModeratorActionsSubmenu>{moderatorItems}</ModeratorActionsSubmenu>
        : moderatorItems
      }
    </DropdownMenu>
  );
}

export default PostActions;


