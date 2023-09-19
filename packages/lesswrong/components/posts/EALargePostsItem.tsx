import React, { useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useHover } from "../common/withHover";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { siteImageSetting } from "../vulcan-core/App";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import { InteractionWrapper } from "../common/useClickableCell";
import moment from "moment";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  postListItem: {
    display: "flex",
    width: "100%",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: "16px 16px",
  },
  postListItemTextSection: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    fontWeight: 500,
    flex: 1,
    maxHeight: 160,
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
    marginRight: 8,
  },
  postListItemTitle: {
    fontSize: 18,
    marginBottom: 8,
    lineHeight: "25px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  postListItemMeta: {
    display: "flex",
    marginBottom: 8,
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
  },
  authors: {
    fontSize: "14px !important",
  },
  commentCount: {
    minWidth: 58,
    marginLeft: 4,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    "& svg": {
      height: 18,
      marginRight: 1,
    },
    "&:hover": {
      color: theme.palette.grey[800],
      opacity: 1,
    },
  },
  postListItemPreview: {
    fontSize: 14,
    lineHeight: "20px",
    color: theme.palette.grey[600],
    position: "relative",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
    marginTop: "auto",
    marginBottom: "auto",
  },
  postListItemImage: {
    height: 140,
    maxWidth: 150,
    objectFit: "cover",
    borderRadius: theme.borderRadius.default,
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  xsHide: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
});

const EALargePostsItem = ({
  post,
  isNarrow,
  noImagePlaceholder,
  className,
  classes,
}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  isNarrow?: boolean,
  noImagePlaceholder?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  const authorExpandContainer = useRef(null);

  const {eventHandlers} = useHover({
    pageElementContext: "postListItem",
    documentId: post._id,
    documentSlug: post?.slug,
  });

  const postLink = post ? postGetPageUrl(post) : "";

  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now"
    ? <span className={classes.xsHide}>&nbsp;ago</span>
    : null;

  let imageUrl = post.socialPreviewData.imageUrl;
  if (!imageUrl && !noImagePlaceholder) {
    imageUrl = siteImageSetting.get();
  }

  const {TruncatedAuthorsList, ForumIcon, PostsItemTooltipWrapper} = Components;
  return (
    <AnalyticsContext documentSlug={post?.slug ?? "unknown-slug"}>
      <div
        {...eventHandlers}
        className={classNames(classes.postListItem, className)}
      >
        <div className={classes.postListItemTextSection}>
          <div className={classes.postListItemTitle}>
            <PostsItemTooltipWrapper post={post} placement="bottom" As="span">
              <Link to={postLink}>{post.title}</Link>
            </PostsItemTooltipWrapper>
          </div>
          {/** TODO
            * The recent discussions redesign adds an `EAPostMeta` component
            * which should probably be used here:
            * https://github.com/ForumMagnum/ForumMagnum/pull/7858/files#diff-56fb35d84b446595acd8a1318777ab5c5d4f1d47434941f5baf9e2949c24431d
            */}
          <div className={classes.postListItemMeta}>
            <div ref={authorExpandContainer}>
              <InteractionWrapper>
                <TruncatedAuthorsList
                  post={post}
                  expandContainer={authorExpandContainer}
                  className={classes.authors}
                />
              </InteractionWrapper>
            </div>
            &nbsp;·&nbsp;
            {timeFromNow}
            {ago}
            &nbsp;·&nbsp;
            {post.readTimeMinutes}m read
            <div>
              {!isNarrow && (
                <span className={classNames(classes.commentCount, classes.xsHide)}>
                  &nbsp;·&nbsp;
                  <Link to={`${postLink}#comments`} className={classes.commentCount}>
                    <ForumIcon icon="Comment" />
                    {post.commentCount}
                  </Link>
                </span>
              )}
            </div>
          </div>
          <div className={classes.postListItemPreview}>
            {post.contents?.plaintextDescription}
          </div>
        </div>
        {imageUrl && <img className={classes.postListItemImage} src={imageUrl} />}
      </div>
    </AnalyticsContext>
  );
};

const EALargePostsItemComponent = registerComponent(
  "EALargePostsItem",
  EALargePostsItem,
  {styles, stylePriority: -1,},
);

declare global {
  interface ComponentTypes {
    EALargePostsItem: typeof EALargePostsItemComponent;
  }
}
