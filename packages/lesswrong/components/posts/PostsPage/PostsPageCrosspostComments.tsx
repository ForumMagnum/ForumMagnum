import React from "react";
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import LaunchIcon from '@material-ui/icons/Launch';
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
  forumTypeSetting,
} from "../../../lib/instanceSettings";
import { useCrosspostContext } from "./PostsPageCrosspostWrapper";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    maxWidth: 720,
    margin: "0 auto 25px auto",
    borderRadius: 4,
    padding: forumTypeSetting.get() === "EAForum" ? "10px 12px" : "10px 10px 8px 10px",
    backgroundColor: theme.palette.crosspost.main,
    fontFamily: theme.typography.headline.fontFamily,
  },
  icon: {
    marginLeft: 4,
    marginTop: forumTypeSetting.get() === "EAForum" ? 0 : -3,
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
    <div>
      <a className={classes.link} href={link} target="_blank" rel="noreferrer">
        <Typography variant="body2" className={classes.root}>
          Crossposted {relation} {fmCrosspostSiteNameSetting.get()}. View {commentsText}.
          <LaunchIcon fontSize="small" className={classes.icon} />
        </Typography>
      </a>
    </div>
  );
}

const PostsPageCrosspostCommentsComponent = registerComponent("PostsPageCrosspostComments", PostsPageCrosspostComments, {styles});

declare global {
  interface ComponentTypes {
    PostsPageCrosspostComments: typeof PostsPageCrosspostCommentsComponent
  }
}
