import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { Placement as PopperPlacementType } from "popper.js"
import { useBookmark } from '../hooks/useBookmark';
import LWTooltip from '../common/LWTooltip';
import ForumIcon from '../common/ForumIcon';
import { BookmarkableCollectionName } from '@/lib/collections/bookmarks/constants';
const styles = (theme: ThemeType) => ({
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
  iconWithTextFriendlyUI: {
    '& svg': {
      transform: "translateY(5px)",
      marginRight: -1,
    },
  },
})


const BookmarkButton = ({
  documentId,
  collectionName,
  withText,
  placement="right",
  overrideTooltipText,
  className,
  classes,
}: {
  documentId: string,
  collectionName: BookmarkableCollectionName,
  withText?: boolean,
  placement?: PopperPlacementType,
  overrideTooltipText?: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {icon, labelText, hoverText, toggleBookmark} = useBookmark(documentId, collectionName);
  const Component = withText ? "a" : "span";
  return (
    <LWTooltip title={overrideTooltipText ?? hoverText} placement={withText ? "bottom" : placement}>
      <Component onClick={toggleBookmark} className={classNames({
        [classes.container]: !withText,
        [classes.iconWithText]: withText,
        [classes.iconWithTextFriendlyUI]: withText && isFriendlyUI(),
      })}>
        <ForumIcon
          icon={icon}
          className={className}
        /> {withText && labelText}
      </Component>
    </LWTooltip>
  );
}

export default registerComponent('BookmarkButton', BookmarkButton, {
  styles,
  hocs: [withErrorBoundary],
});


