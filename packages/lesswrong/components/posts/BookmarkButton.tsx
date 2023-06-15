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

const BookmarkButton = ({
  post,
  withText,
  placement="right",
  className,
  classes,
}: {
  post: PostsBase,
  withText?: boolean,
  placement?: TooltipProps["placement"],
  className?: string,
  classes: ClassesType,
}) => {
  const {icon, labelText, hoverText, toggleBookmark} = useBookmarkPost(post);
  const Component = withText ? "a" : "span";
  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip title={hoverText} placement={withText ? "bottom" : placement}>
      <Component onClick={toggleBookmark} className={classNames({
        [classes.container]: !withText,
        [classes.iconWithText]: withText,
        [classes.iconWithTextEAForum]: withText && isEAForum,
      })}>
        <ForumIcon
          icon={icon}
          className={classNames(classes.icon, className)}
        /> {withText && labelText}
      </Component>
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
