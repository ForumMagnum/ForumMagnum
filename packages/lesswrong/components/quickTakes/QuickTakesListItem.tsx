import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";
import { isLWorAF } from "../../lib/instanceSettings";
import classNames from "classnames";
import { NoSSR } from "../../lib/utils/componentsWithChildren";

const styles = (_theme: ThemeType) => ({
  expandedRoot: {
    "& .comments-node-root": {
      marginBottom: 8,
      ...(isLWorAF ? {
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
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "shortformItemExpanded" : "shortformItemCollapsed");
  }, [captureEvent, setExpanded]);

  const {CommentsNode, QuickTakesCollapsedListItem, LWQuickTakesCollapsedListItem} = Components;

  const CollapsedListItem = isFriendlyUI ? QuickTakesCollapsedListItem : LWQuickTakesCollapsedListItem;

  // We're doing both a NoSSR + conditional `display: 'none'` to toggle between the collapsed & expanded quick take
  // This is to eliminate a loading spinner (for the child comments) when someone expands a quick take,
  // while avoiding the impact to the home page SSR speed for the large % of users who won't interact with quick takes at all
  const expandedComment = (
    <NoSSR>
      <div className={classNames(classes.expandedRoot, { [classes.hidden]: !expanded })}>
        <CommentsNode
          treeOptions={{
            post: quickTake.post ?? undefined,
            showCollapseButtons: isFriendlyUI,
            onToggleCollapsed: () => wrappedSetExpanded(!expanded),
          }}
          comment={quickTake}
          loadChildrenSeparately
          forceUnTruncated
          forceUnCollapsed
        />
      </div>
    </NoSSR>
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

const QuickTakesListItemComponent = registerComponent(
  "QuickTakesListItem",
  QuickTakesListItem,
  {styles},
);

declare global {
  interface ComponentTypes {
    QuickTakesListItem: typeof QuickTakesListItemComponent
  }
}
