import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isPostsListViewType, usePostsListView } from "../hooks/usePostsListView";
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {
    position: "relative",
  },
  flag: {
    position: "absolute",
    right: -34,
    top: 8,
    width: 34,
    height: 18,
    padding: "2px 4px",
    background: theme.palette.primary.dark,
    color: theme.palette.text.alwaysWhite,
    borderRadius: theme.borderRadius.small,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 11,
    fontWeight: 600,
  },
  flagPoint: {
    position: "absolute",
    top: 6,
    left: -3,
    width: 6,
    height: 6,
    transform: "scaleY(70%) rotate(45deg)",
    background: theme.palette.primary.dark,
  },
});

const options = {
  card: {label: "Card view", icon: "CardView"},
  list: {label: "List view", icon: "ListView"},
} as const;

const PostsListViewToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {captureEvent} = useTracking();
  const {view, setView} = usePostsListView();

  const onSelect = useCallback((value: string) => {
    if (isPostsListViewType(value)) {
      setView(value);
      captureEvent("postsListViewToggle", {value});
    }
  }, [setView, captureEvent]);

  const {ForumDropdown} = Components;
  return (
    <div className={classes.root}>
      <ForumDropdown
        value={view}
        options={options}
        onSelect={onSelect}
        paddingSize={24}
        useIconLabel
        className={classes.root}
      />
      <div className={classes.flag}>
        <div className={classes.flagPoint} />
        NEW
      </div>
    </div>
  );
}

const PostsListViewToggleComponent = registerComponent(
  "PostsListViewToggle",
  PostsListViewToggle,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsListViewToggle: typeof PostsListViewToggleComponent
  }
}
