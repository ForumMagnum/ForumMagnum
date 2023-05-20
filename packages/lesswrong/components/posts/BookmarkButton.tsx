import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import type {TooltipProps} from '@material-ui/core/Tooltip';
import { useTracking } from '../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import * as _ from 'underscore';
import { isEAForum } from '../../lib/instanceSettings';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  container: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
  iconWithText: {
    color: theme.palette.text.dim3,
    display: "inline-block",
    marginRight: 20,
    "@media print": { display: "none" },
    '& svg': {
      fontSize: "1.35em",
      transform: "translateY(6px)",
      marginLeft: -3,
      marginRight: -3,
    },
  },
  iconWithTextEAForum: {
    '& svg': {
      transform: "translateY(5px)",
      marginRight: -1,
    },
  },
})

const BookmarkButton = ({classes, post, variant='icon', placement="right", className}: {
  classes: ClassesType,
  post: PostsBase,
  variant?: 'menuItem'|'icon'|'iconWithText',
  placement?: TooltipProps["placement"],
  className?: string,
}) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const [bookmarked, setBookmarkedState] = useState(_.pluck((currentUser?.bookmarkedPostsMetadata || []), 'postId')?.includes(post._id))
  const { captureEvent } = useTracking()

  const [setIsBookmarkedMutation] = useMutation(gql`
    mutation setIsBookmarked($postId: String!, $isBookmarked: Boolean!) {
      setIsBookmarked(postId: $postId, isBookmarked: $isBookmarked) {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery("UsersCurrent")}
  `);
  const setBookmarked = (isBookmarked: boolean) => {
    setBookmarkedState(isBookmarked)
    void setIsBookmarkedMutation({
      variables: {postId: post._id, isBookmarked}
    });
  };

  const { LWTooltip, MenuItem, ForumIcon } = Components;

  const toggleBookmark = (event: React.MouseEvent) => {
    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {}
      });
      event.preventDefault();
      return
    }

    setBookmarked(!bookmarked);
    captureEvent("bookmarkToggle", {"postId": post._id, "bookmarked": !bookmarked})
  }

  const iconNode = <ForumIcon
    icon={bookmarked ? "Bookmark" : "BookmarkBorder"}
    className={classNames(classes.icon, className)}
  />
  const bookmarkText = bookmarked ? "Un-bookmark" : "Bookmark";
  const savedPostLabelText = bookmarked ? "Saved" : "Save";
  const savedPostHoverText = bookmarked ? "Remove from saved posts" : "Save post for later";

  const hoverText = isEAForum ? savedPostHoverText : bookmarkText;
  const labelText = isEAForum ? savedPostLabelText : bookmarkText;

  switch(variant) {
    case 'menuItem':
      return (
        <MenuItem onClick={toggleBookmark}>
          <ListItemIcon>
            {iconNode}
          </ListItemIcon>
          {labelText}
        </MenuItem>
      )
    case 'iconWithText':
      return (
        <LWTooltip title={hoverText} placement="bottom">
          <a onClick={toggleBookmark} className={classNames(classes.iconWithText, {[classes.iconWithTextEAForum]: isEAForum})}>
            {iconNode} {labelText}
          </a>
        </LWTooltip>
      )
    case 'icon':
    default:
      return (
        <LWTooltip title={hoverText} placement={placement}>
          <span onClick={toggleBookmark} className={classes.container}>
            {iconNode}
          </span>
        </LWTooltip>
    )
  }
}

const BookmarkButtonComponent = registerComponent('BookmarkButton', BookmarkButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    BookmarkButton: typeof BookmarkButtonComponent
  }
}
