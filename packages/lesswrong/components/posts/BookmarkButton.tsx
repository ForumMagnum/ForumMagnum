import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { Placement as PopperPlacementType } from "popper.js"
import { useBookmark } from '../hooks/useBookmark';
import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

export const bookmarkableCollectionNames = new TupleSet(["Posts", "Comments"] as const);

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


const BookmarkButtonInner = ({
  documentId,
  collectionName,
  withText,
  placement="right",
  overrideTooltipText,
  className,
  classes,
}: {
  documentId: string,
  collectionName: UnionOf<typeof bookmarkableCollectionNames>,
  withText?: boolean,
  placement?: PopperPlacementType,
  overrideTooltipText?: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {icon, labelText, hoverText, toggleBookmark} = useBookmark(documentId, collectionName);
  const Component = withText ? "a" : "span";
  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip title={overrideTooltipText ?? hoverText} placement={withText ? "bottom" : placement}>
      <Component onClick={toggleBookmark} className={classNames({
        [classes.container]: !withText,
        [classes.iconWithText]: withText,
        [classes.iconWithTextFriendlyUI]: withText && isFriendlyUI,
      })}>
        <ForumIcon
          icon={icon}
          className={className}
        /> {withText && labelText}
      </Component>
    </LWTooltip>
  );
}

export const BookmarkButton = registerComponent('BookmarkButton', BookmarkButtonInner, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    BookmarkButton: typeof BookmarkButton
  }
}
