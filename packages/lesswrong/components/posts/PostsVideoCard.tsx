import React, { useMemo } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cheerioParse } from "../../server/utils/htmlUtil";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginBottom: 16,
  },
  frame: {
    border: "none",
    width: "100%",
    height: 183,
  },
});

const videoHosts = [
  "https://www.youtube.com",
  "https://youtube.com",
  "https://youtu.be",
];

const getEmbedAttribsFromHtml = (html: string): Record<string, unknown> | null => {
  const $ = cheerioParse(html);
  const iframes = $("iframe").toArray();
  for (const iframe of iframes) {
    if ("attribs" in iframe) {
      const src = iframe.attribs.src ?? "";
      for (const host of videoHosts) {
        if (src.indexOf(host) === 0) {
          return iframe.attribs;
        }
      }
    }
  }
  return null;
}

const PostsVideoCard = ({post, classes}: {
  post: PostsBestOfList,
  classes: ClassesType,
}) => {
  const {eventHandlers} = useHover({
    pageElementContext: "videoCard",
    documentId: post._id,
    documentSlug: post.slug,
  });

  const htmlHighlight = post.contents?.htmlHighlight ?? "";
  const embedAttribs = useMemo(
    () => getEmbedAttribsFromHtml(htmlHighlight),
    [htmlHighlight],
  );
  if (!embedAttribs) {
    return null;
  }

  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div {...eventHandlers} className={classes.root}>
        <iframe {...embedAttribs} className={classes.frame} />
      </div>
    </AnalyticsContext>
  );
}

const PostsVideoCardComponent = registerComponent(
  "PostsVideoCard",
  PostsVideoCard,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostsVideoCard: typeof PostsVideoCardComponent;
  }
}
