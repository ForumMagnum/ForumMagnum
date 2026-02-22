import classNames from "classnames";
import { useCallback, useState } from "react";
import { useTracking } from "../../lib/analyticsEvents";
import { isLWorAF } from "../../lib/instanceSettings";
import { registerComponent } from "../../lib/vulcan-lib/components";
import CommentsNode from "../comments/CommentsNode";
import DeferRender from "../common/DeferRender";
import LWQuickTakesCollapsedListItem from "./LWQuickTakesCollapsedListItem";

const styles = (theme: ThemeType) => ({
  expandedRoot: {
    position: "relative",
    "& .comments-node-root": {
      marginBottom: 8,
      ...(isLWorAF() ? {
        paddingTop: 0,
        // This is to cause the "scroll to parent" sidebar to be positioned with respect to the top-level comment node, rather than the entire section
        position: 'relative',
      } : {}),

    },
  },
  hidden: {
    display: 'none',
  },
});

const QuickTakesListItem = ({quickTake, classes}: {
  quickTake: ShortformComments,
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "shortformItemExpanded" : "shortformItemCollapsed");
  }, [captureEvent, setExpanded]);
  const CollapsedListItem = LWQuickTakesCollapsedListItem;

  // We're doing both a NoSSR + conditional `display: 'none'` to toggle between the collapsed & expanded quick take
  // This is to eliminate a loading spinner (for the child comments) when someone expands a quick take,
  // while avoiding the impact to the home page SSR speed for the large % of users who won't interact with quick takes at all
  const expandedComment = (
    <DeferRender ssr={false}>
      <div className={classNames(classes.expandedRoot, { [classes.hidden]: !expanded })}>
        <CommentsNode
          treeOptions={{
            post: quickTake.post ?? undefined,
            showCollapseButtons: false,
            onToggleCollapsed: () => wrappedSetExpanded(!expanded),
          }}
          comment={quickTake}
          loadChildrenSeparately
          forceUnTruncated
          forceUnCollapsed
        />
      </div>
    </DeferRender>
  );

  const collapsedComment = (
    <div className={classNames({ [classes.hidden]: expanded })}>
      <CollapsedListItem quickTake={quickTake} setExpanded={wrappedSetExpanded} />
    </div>
  );

  return <>
    {expandedComment}
    {collapsedComment}
  </>;
}

export default registerComponent(
  "QuickTakesListItem",
  QuickTakesListItem,
  {styles},
);


