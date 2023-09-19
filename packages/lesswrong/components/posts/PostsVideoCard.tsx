import React, { useMemo, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import cheerio from "cheerio";

const styles = (theme: ThemeType) => ({
  root: {
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    padding: 12,
    marginBottom: 16,
    color: theme.palette.text.slightlyIntense2,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 14,
  },
  header: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  karma: {
    marginLeft: 4,
    marginBottom: 10,
  },
  postTitle: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  metadata: {
    marginTop: 4,
    marginBottom: 12,
    display: "flex",
    alignItems: "center",
    gap: "6px",
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
  // @ts-ignore cheerio type definitions are broken
  const $ = cheerio.load(html, null, false);
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
  const authorExpandContainer = useRef(null);
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

  const {
    PostsItemTooltipWrapper, PostsTitle, TruncatedAuthorsList, PostsItemDate,
    EAKarmaDisplay,
  } = Components;
  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div {...eventHandlers} className={classes.root}>
        <div className={classes.header}>
          <EAKarmaDisplay post={post} className={classes.karma} />
          <div>
            <PostsItemTooltipWrapper post={post}>
              <PostsTitle post={post} wrap className={classes.postTitle} />
            </PostsItemTooltipWrapper>
            <div className={classes.metadata} ref={authorExpandContainer}>
              <TruncatedAuthorsList
                post={post}
                expandContainer={authorExpandContainer}
              />
              <span>·</span>
              <PostsItemDate post={post} noStyles includeAgo />
            </div>
          </div>
        </div>
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
