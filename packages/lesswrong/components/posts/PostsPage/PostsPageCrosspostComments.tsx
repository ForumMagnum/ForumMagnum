import React from "react";
import {
  fmCrosspostSiteNameSetting,
  fmCrosspostBaseUrlSetting,
} from "../../../lib/instanceSettings";
import { usePostsPageContext } from "./PostsPageContext";
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

const PostsPageCrosspostComments = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const postsPage = usePostsPageContext();
  const post = postsPage?.fullPost ?? postsPage?.postPreload;
  if (!post?.fmCrosspost) {
    return null;
  }
  const {hostedHere, foreignPostId} = post.fmCrosspost;
  if (!foreignPostId) {
    return null;
  }

  const relation = hostedHere ? "to" : "from";
  // TODO: We need to fetch the comment count and foreign URL from the other site
  const commentCount = 0; // foreignPost.commentCount ?? 0;
  const noComments = commentCount === 0;

  const commentsText = noComments
    ? "Click to view."
    : `Click to view ${commentCount} comment${commentCount === 1 ? "" : "s"}.`;

  const postPageUrl = postGetPageUrl({
    _id: foreignPostId,
    slug: post.slug,
  });
  const link = combineUrls(fmCrosspostBaseUrlSetting.get() ?? "", `${postPageUrl}${noComments ? "" : "#comments"}`);

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

export default registerComponent("PostsPageCrosspostComments", PostsPageCrosspostComments, {styles});
