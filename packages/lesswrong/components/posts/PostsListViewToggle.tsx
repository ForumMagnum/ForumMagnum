import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { usePostsListView } from "../hooks/usePostsListView";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

const PostsListViewToggle = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {view, setView} = usePostsListView();
  return (
    <div className={classes.root} onClick={() => setView(view === "card" ? "list" : "card")}>
      Toggle
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
