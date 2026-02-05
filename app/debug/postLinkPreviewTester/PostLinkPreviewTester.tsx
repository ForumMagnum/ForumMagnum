"use client";
import React from "react";
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { useLocation, useNavigate } from "@/lib/routeUtil";
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { Link } from "@/lib/reactRouterWrapper";
import HoverPreviewLink from "@/components/linkPreview/HoverPreviewLink";
import { post } from "request";

const styles = defineStyles("PostLinkPreviewTester", (theme: ThemeType) => ({
  metadata: {
    ...theme.typography.body2,
    "& input": {
      padding: 8,
      background: theme.palette.panelBackground.default,
    }
  },
  previewContainer: {
    marginTop: 32,
    padding: 60,
    background: theme.dark ? "black" : "white",

    ...(theme.dark ? {
      "& img": {
        // Border and sizing from Twitter's theme (dark mode) to preview what
        // it's likely to look like there
        width: 515,
        borderRadius: 16,
        border: "0px",
      }
    } : {
      "& img": {
        // Border and sizing from Twitter's theme (light mode)
        width: 515,
        borderRadius: 16,
        border: `1px solid rgb(207, 217, 222)`,
      }
    }),
  },
}), {
  allowNonThemeColors: true,
});

export function PostLinkPreviewTester({ postId }: { postId: string|null }) {
  const classes = useStyles(styles);
  const location = useLocation();
  const navigate = useNavigate();
  const postLink = postId ? `/posts/${postId}` : null;

  const setPostID = (newPostId: string) => {
    navigate(`${location.pathname}?postId=${newPostId}`);
  };

  return <SingleColumnSection>
    <h1>Post Link Preview Tester</h1>

    <div className={classes.metadata}>
      <div>Post ID: <input type="text" value={postId ?? ""} onChange={(e) => setPostID(e.target.value)} /></div>
      {postLink && <div>Link: <HoverPreviewLink href={postLink}>{postLink}</HoverPreviewLink></div>}
    </div>

    {postId && <div className={classes.previewContainer}>
      <div><img src={`/api/preview/post/${postId}?format=og`} /></div>
    </div>}
  </SingleColumnSection>
}
