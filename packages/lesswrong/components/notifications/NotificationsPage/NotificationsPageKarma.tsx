import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import type {
  CommentKarmaChange,
  KarmaChanges,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../../lib/types/karmaChangesTypes";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection :"column",
    gap: "24px",
  },
});

const NotificationsPageKarma = ({karmaChanges, classes}: {
  karmaChanges?: KarmaChanges,
  classes: ClassesType<typeof styles>,
}) => {
  if (!karmaChanges) {
    return null;
  }
  const {posts, comments, tagRevisions} = karmaChanges;
  const {NotificationsPageKarmaItem} = Components;
  return (
    <div className={classes.root}>
      {posts.map((post: PostKarmaChange) => (
        <NotificationsPageKarmaItem post={post} key={post._id} />
      ))}
      {comments.map((comment: CommentKarmaChange) => (
        <NotificationsPageKarmaItem comment={comment} key={comment._id} />
      ))}
      {tagRevisions.map((tag: TagRevisionKarmaChange) => (
        <NotificationsPageKarmaItem tagRevision={tag} key={tag._id} />
      ))}
    </div>
  );
}


const NotificationsPageKarmaComponent = registerComponent(
  "NotificationsPageKarma",
  NotificationsPageKarma,
  {styles},
);

declare global {
  interface ComponentTypes {
    NotificationsPageKarma: typeof NotificationsPageKarmaComponent
  }
}
