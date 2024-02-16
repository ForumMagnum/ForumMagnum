import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (_theme: ThemeType) => ({
  expandedRoot: {
    "& .comments-node-root": {
      marginBottom: 4, // this isn't the correct final thing to be doing here
    },
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

  const CollapsedListItem = isFriendlyUI ? 
  <QuickTakesCollapsedListItem  quickTake={quickTake} setExpanded={wrappedSetExpanded}/> : 
  <LWQuickTakesCollapsedListItem
    quickTake={quickTake}
    expanded={expanded}
    setExpanded={wrappedSetExpanded}
    treeOptions={{
      post: quickTake.post ?? undefined,
      showCollapseButtons: true,
      onToggleCollapsed: () => wrappedSetExpanded(!expanded),
    }}
  />

  return expanded
    ? (
      <div className={classes.expandedRoot}>
        <CommentsNode
          treeOptions={{
            post: quickTake.post ?? undefined,
            showCollapseButtons: true,
            onToggleCollapsed: () => wrappedSetExpanded(!expanded),
          }}
          comment={quickTake}
          loadChildrenSeparately
          forceUnTruncated
          forceUnCollapsed
        />
      </div>
    )
    : CollapsedListItem;
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
