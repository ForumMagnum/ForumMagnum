import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { Link } from "../../../lib/reactRouterWrapper";
import type {
  CommentKarmaChange,
  PostKarmaChange,
  TagRevisionKarmaChange,
} from "../../../lib/types/karmaChangesTypes";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection :"column",
    gap: "24px",
    marginTop: 24,
  },
  text: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    "& a": {
      color: theme.palette.primary.main,
      fontWeight: 600,
      marginLeft: 10,
    },
  },
});

const NotificationsPageKarma = ({karmaChanges, classes}: {
  karmaChanges?: UserKarmaChanges,
  classes: ClassesType<typeof styles>,
}) => {
  if (!karmaChanges?.karmaChanges) {
    return null;
  }
  const {posts, comments, tagRevisions, updateFrequency} = karmaChanges.karmaChanges;
  const batchedText = updateFrequency === "realtime"
    ? "in realtime"
    : `batched ${updateFrequency}`;
  const {NotificationsPageKarmaItem} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.text}>
        Karma notifications are {batchedText}
        <Link to="/account">Change settings</Link>
      </div>
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
