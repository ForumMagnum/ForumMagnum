import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useBookmarkPost } from '../hooks/useBookmarkPost';
import withErrorBoundary from '../common/withErrorBoundary';
import type { TooltipProps } from '@material-ui/core/Tooltip';
import { isEAForum } from '../../lib/instanceSettings';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  container: {
    cursor: "pointer",
    color: theme.palette.icon.dim3,
  },
  icon: isEAForum ? {fontSize: 22} : {},
})

const BookmarkButton = ({post, placement="right", className, classes}: {
  post: PostsBase,
  placement?: TooltipProps["placement"],
  className?: string,
  classes: ClassesType,
}) => {
  const {icon, title, toggleBookmark} = useBookmarkPost(post);
  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip title={title} placement={placement}>
      <span onClick={toggleBookmark} className={classes.container}>
        <ForumIcon icon={icon} className={classNames(classes.icon, className)} />
      </span>
    </LWTooltip>
  );
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
