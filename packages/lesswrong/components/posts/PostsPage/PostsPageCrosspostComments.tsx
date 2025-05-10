import React from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";
import { useCrosspostContext } from "./PostsPageCrosspostWrapper";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { combineUrls } from "../../../lib/vulcan-lib/utils";
import { Typography } from "../../common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    margin: "0 auto 1.3em auto",
    border: theme.palette.border.commentBorder,
    borderRadius: 3,
    padding: 12,
  },
});

const PostsPageCrosspostCommentsInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const context = useCrosspostContext();
  if (!context?.foreignPost) {
    return null;
  }
  const {hostedHere, foreignPost} = context;

  const relation = hostedHere ? "to" : "from";
  const commentCount = foreignPost.commentCount ?? 0;
  const noComments = commentCount === 0;

  const commentsText = noComments
    ? "Click to view."
    : `Click to view ${commentCount} comment${commentCount === 1 ? "" : "s"}.`;
  const link = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `${postGetPageUrl(foreignPost)}${noComments ? "" : "#comments"}`);
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

export const PostsPageCrosspostComments = registerComponent("PostsPageCrosspostComments", PostsPageCrosspostCommentsInner, {styles});


