import React, { useCallback, useState } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { useTracking } from "../../lib/analyticsEvents";

const QuickTakesListItem = ({quickTake}: {
  quickTake: ShortformComments,
  classes: ClassesType,
}) => {
  const {captureEvent} = useTracking();
  const [expanded, setExpanded] = useState(false);
  const wrappedSetExpanded = useCallback((value: boolean) => {
    setExpanded(value);
    captureEvent(value ? "shortformItemExpanded" : "shortformItemCollapsed");
  }, [captureEvent, setExpanded]);

  const {CommentsNode, QuickTakesCollapsedListItem} = Components;
  return expanded
    ? (
      <CommentsNode
        treeOptions={{
          post: quickTake.post ?? undefined,
          showCollapseButtons: true,
          onToggleCollapsed: () => wrappedSetExpanded(!expanded),
        }}
        comment={quickTake}
        loadChildrenSeparately
      />
    )
    : (
      <QuickTakesCollapsedListItem
        quickTake={quickTake}
        setExpanded={wrappedSetExpanded}
      />
    );
}

const QuickTakesListItemComponent = registerComponent(
  "QuickTakesListItem",
  QuickTakesListItem,
);

declare global {
  interface ComponentTypes {
    QuickTakesListItem: typeof QuickTakesListItemComponent
  }
}
