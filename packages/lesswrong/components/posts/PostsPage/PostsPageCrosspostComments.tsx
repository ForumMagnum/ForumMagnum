import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";
import { useCrosspostContext } from "./PostsPageCrosspostWrapper";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    maxWidth: 720,
    margin: "0 auto 25px auto",
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    padding: 12,
  },
  link: {
    color: theme.palette.primary.main,
  },
});

const PostsPageCrosspostComments = ({classes}: {classes: ClassesType}) => {
  const context = useCrosspostContext();
  if (!context?.foreignPost) {
    return null;
  }
  const {hostedHere, foreignPost} = context;

  const relation = hostedHere ? "to" : "from";
  const comments = foreignPost.commentCount ?? 0;
  const commentsText = `${comments} comment${comments === 1 ? "" : "s"}`;
  const link = `${fmCrosspostBaseUrlSetting.get()}posts/${foreignPost._id}`;

  const {Typography} = Components;
  return (
    <div className={classes.root}>
      <Typography variant="body2">
        This post was crossposted {relation} {fmCrosspostSiteNameSetting.get()} where it has {commentsText}.{" "}
        <a className={classes.link} href={link} target="_blank" rel="noreferrer">
          Click to view
        </a>.
      </Typography>
    </div>
  );
}

const PostsPageCrosspostCommentsComponent = registerComponent("PostsPageCrosspostComments", PostsPageCrosspostComments, {styles});

declare global {
  interface ComponentTypes {
    PostsPageCrosspostComments: typeof PostsPageCrosspostCommentsComponent
  }
}
