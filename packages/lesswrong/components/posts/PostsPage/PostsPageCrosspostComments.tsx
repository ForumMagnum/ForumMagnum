import React from "react";
import { Components, registerComponent, combineUrls } from "../../../lib/vulcan-lib";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";
import { useCrosspostContext } from "./PostsPageCrosspostWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    margin: "0 auto 1.3em auto",
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    padding: 12,
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
  const commentsText = comments === 0
    ? "Click to view."
    : `Click to view ${comments} comment${comments === 1 ? "" : "s"}.`;
  const link = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", postGetPageUrl(foreignPost));

  const {Typography} = Components;
  return (
    <div>
      <a href={link} target="_blank" rel="noreferrer">
        <Typography variant="body2" className={classes.root}>
          Crossposted {relation} {fmCrosspostSiteNameSetting.get()}. {commentsText}
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
