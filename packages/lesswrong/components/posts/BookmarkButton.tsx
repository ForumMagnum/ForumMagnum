import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import React, { useState } from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Bookmark from '@material-ui/icons/Bookmark'
import BookmarkBorder from '@material-ui/icons/BookmarkBorder'
import { useCurrentUser } from '../common/withUser';
import { useDialog } from '../common/withDialog';
import withErrorBoundary from '../common/withErrorBoundary';
import type {TooltipProps} from '@material-ui/core/Tooltip';
import { useTracking } from '../../lib/analyticsEvents';
import { useMutation, gql } from '@apollo/client';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
  iconWithText: {
    color: theme.palette.text.dim3,
    whiteSpace: "no-wrap",
    display: "inline-block",
    marginRight: 20,
    "@media print": { display: "none" },
    '& svg': {
      fontSize: "1.45em",
      transform: "translateY(5px)",
      marginLeft: -3,
      marginRight: -1,
    },
  }
})

const BookmarkButton = ({classes, post, variant='icon', placement="right"}: {
  classes: ClassesType,
  post: PostsBase,
  variant?: 'menuItem'|'icon'|'iconWithText',
  placement?: TooltipProps["placement"],
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

  const { LWTooltip } = Components

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

  const icon = bookmarked ? <Bookmark/> : <BookmarkBorder/>
  const title = bookmarked ? "Un-bookmark" : "Bookmark"
  const saveText = bookmarked ? "Saved" : "Save"
  const saveHoverText = bookmarked ? "Remove from saved posts" : "Save post for later"

  switch(variant) {
    case 'menuItem':
      return (
        <MenuItem onClick={toggleBookmark}>
          <ListItemIcon>
            { icon }
          </ListItemIcon>
          {title}
        </MenuItem>
      )
    case 'iconWithText':
      return (
        <LWTooltip title={saveHoverText} placement={placement}>
          <a onClick={toggleBookmark} className={classes.iconWithText}>
            { icon } { saveText }
          </a>
        </LWTooltip>
      )
    case 'icon':
    default:
      return (
        <LWTooltip title={title} placement={placement}>
          <span onClick={toggleBookmark} className={classes.icon}>
          { icon }
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
