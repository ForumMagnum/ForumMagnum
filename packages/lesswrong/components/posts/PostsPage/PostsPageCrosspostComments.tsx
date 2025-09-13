import React, { useEffect, useState } from "react";
import { fmCrosspostSiteNameSetting } from "../../../lib/instanceSettings";
import { crosspostDetailsRoute } from "@/lib/fmCrosspost/routes";
import { usePostsPageContext } from "./PostsPageContext";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { Typography } from "../../common/Typography";
import Loading from "@/components/vulcan-core/Loading";

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

type Response = {
  loading: boolean,
  data?: { canonicalLink: string, commentCount: number },
}

const PostsPageCrosspostCommentsInner = ({foreignPostId, hostedHere, classes}: {
  foreignPostId: string,
  hostedHere: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const [response, setResponse] = useState<Response>({ loading: true });

  useEffect(() => {
    void (async () => {
      try {
        const data = await crosspostDetailsRoute.makeRequest(
          {postId: foreignPostId},
          {foreignRequest: true},
        );
        setResponse({ loading: false, data });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching foreign crosspost details:", error);
        setResponse({ loading: false });
      }
    })();
  }, [foreignPostId]);

  if (response.loading) {
    return (
      <div>
        <Loading />
      </div>
    );
  }

  if (!response.data) {
    return null;
  }

  const {canonicalLink, commentCount} = response.data;
  const relation = hostedHere ? "to" : "from";
  const commentsText = !commentCount
    ? "Click to view."
    : `Click to view ${commentCount} comment${commentCount === 1 ? "" : "s"}.`;

  return (
    <div>
      <a href={canonicalLink} target="_blank" rel="noreferrer">
        <Typography variant="body2" className={classes.root}>
          Crossposted {relation} {fmCrosspostSiteNameSetting.get()}. {commentsText}
        </Typography>
      </a>
    </div>
  );
}

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
  return (
    <PostsPageCrosspostCommentsInner
      foreignPostId={foreignPostId}
      hostedHere={!!hostedHere}
      classes={classes}
    />
  );
}

export default registerComponent(
  "PostsPageCrosspostComments",
  PostsPageCrosspostComments,
  {styles},
);
