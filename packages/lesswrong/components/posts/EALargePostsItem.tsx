import React, { useRef } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useHover } from "../common/withHover";
import { postGetPageUrl } from "../../lib/collections/posts/helpers";
import { siteImageSetting } from '@/lib/instanceSettings';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from "../../lib/reactRouterWrapper";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import moment from "moment";
import classNames from "classnames";
import TruncatedAuthorsList from "./TruncatedAuthorsList";
import ForumIcon from "../common/ForumIcon";
import PostsItemTooltipWrapper from "./PostsItemTooltipWrapper";
import TimeTag from "../common/TimeTag";

const styles = (theme: ThemeType) => ({
  postListItem: {
    cursor: "pointer",
    display: "flex",
    width: "100%",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    padding: "16px 16px",
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`
    },
  },
  postListItemTextSection: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: "flex",
    flexDirection: "column",
    fontWeight: 500,
    flex: 1,
    maxHeight: 160,
    minWidth: 0, // Magic flexbox property to prevent overflow, see https://stackoverflow.com/a/66689926
  },
  postListItemTitle: {
    color: theme.palette.text.normal,
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 2,
    lineHeight: "24px",
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  postListItemMeta: {
    display: "flex",
    marginBottom: 12,
    fontSize: 13,
    lineHeight: "20px",
    color: theme.palette.grey[600],
  },
  authors: {
    fontSize: "13px !important",
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
    lineHeight: "1.5em",
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
    width: 170,
    height: 121,
    objectFit: "cover",
    marginLeft: 16,
    borderRadius: theme.borderRadius.small,
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
  post: PostsList,
  isNarrow?: boolean,
  noImagePlaceholder?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const authorExpandContainer = useRef(null);

  const postLink = postGetPageUrl(post);
  const {onClick} = useClickableCell({href: postLink});

  const {eventHandlers} = useHover({
    eventProps: {
      pageElementContext: "postListItem",
      documentId: post._id,
      documentSlug: post.slug,
    },
  });

  const timeFromNow = moment(new Date(post.postedAt)).fromNow();
  const ago = timeFromNow !== "now"
    ? <span className={classes.xsHide}>&nbsp;ago</span>
    : null;

  let imageUrl = post.socialPreviewData.imageUrl;
  if (!imageUrl && !noImagePlaceholder) {
    imageUrl = siteImageSetting.get();
  }

  const description = post?.contents?.plaintextDescription;

  return (
    <AnalyticsContext documentSlug={post.slug}>
      <div
        {...eventHandlers}
        onClick={onClick}
        className={classNames(classes.postListItem, className)}
      >
        <div className={classes.postListItemTextSection}>
          <div className={classes.postListItemTitle}>
            <PostsItemTooltipWrapper post={post} placement="bottom" As="span">
              <InteractionWrapper>
                <Link to={postLink}>{post.title}</Link>
              </InteractionWrapper>
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
            <TimeTag dateTime={post.postedAt}>
              {timeFromNow}
              {ago}
            </TimeTag>
            &nbsp;·&nbsp;
            {post.readTimeMinutes}m read
            <div>
              {!isNarrow && (
                <span className={classNames(classes.commentCount, classes.xsHide)}>
                  &nbsp;·&nbsp;
                  <InteractionWrapper>
                    <Link to={`${postLink}#comments`} className={classes.commentCount}>
                      <ForumIcon icon="Comment" />
                      {post.commentCount}
                    </Link>
                  </InteractionWrapper>
                </span>
              )}
            </div>
          </div>
          <div className={classes.postListItemPreview}>
            {description}
          </div>
        </div>
        {imageUrl && <img className={classes.postListItemImage} src={imageUrl} />}
      </div>
    </AnalyticsContext>
  );
};

export default registerComponent(
  "EALargePostsItem",
  EALargePostsItem,
  {styles, stylePriority: -1,},
);
