import { BookmarkableCollectionName } from '@/lib/collections/bookmarks/constants';
import classNames from 'classnames';
import type { Placement as PopperPlacementType } from "popper.js";
import { registerComponent } from '../../lib/vulcan-lib/components';
import ForumIcon from '../common/ForumIcon';
import LWTooltip from '../common/LWTooltip';
import withErrorBoundary from '../common/withErrorBoundary';
import { useBookmark } from '../hooks/useBookmark';
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
})


const BookmarkButton = ({
  documentId,
  collectionName,
  initial,
  withText,
  placement="right",
  overrideTooltipText,
  className,
  classes,
}: {
  documentId: string,
  collectionName: BookmarkableCollectionName,
  initial?: boolean,
  withText?: boolean,
  placement?: PopperPlacementType,
  overrideTooltipText?: string,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {icon, labelText, hoverText, toggleBookmark} = useBookmark(documentId, collectionName, initial);
  const Component = withText ? "a" : "span";
  return (
    <LWTooltip title={overrideTooltipText ?? hoverText} placement={withText ? "bottom" : placement}>
      <Component onClick={toggleBookmark} className={classNames({
        [classes.container]: !withText,
        [classes.iconWithText]: withText,
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

