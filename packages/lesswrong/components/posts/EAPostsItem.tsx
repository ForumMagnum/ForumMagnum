import React, { FC, useRef } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { usePostsItem, PostsItemConfig } from "./usePostsItem";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";
import { Link } from "../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import withErrorBoundary from "../common/withErrorBoundary";
import classNames from "classnames";
import { useClickableCell } from "../common/useClickableCell";

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: SECTION_WIDTH,
  },
  readCheckbox: {
    minWidth: 24,
  },
  expandedCommentsWrapper: {
    display: "flex",
    flexDirection: "column",
    minWidth: "100%",
    maxWidth: "100%",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`,
    },
    "&:hover .PostsItemTrailingButtons-actions": {
      opacity: 0.2,
    },
    "&:hover .PostsItemTrailingButtons-archiveButton": {
      opacity: 0.2,
    },
  },
  container: {
    position: "relative",
    flexGrow: 1,
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    padding: `8px 12px 8px 0`,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      paddingRight: 12,
    },
  },
  karma: {
    width: 50,
    minWidth: 50,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  tagRelWrapper: {
    position: "relative",
    marginLeft: 30,
  },
  voteArrow: {
    color: theme.palette.grey[400],
    margin: "-6px 0 2px 0",
  },
  details: {
    flexGrow: 1,
    minWidth: 0, // flexbox black magic
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginBottom: 2,
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      maxWidth: "100%",
    },
    [theme.breakpoints.down("xs")]: {
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": 3,
    },
  },
  meta: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
  },
  metaLeft: {
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
    "& > :first-child": {
      marginRight: 5,
    },
  },
  readTime: {
    "@media screen and (max-width: 350px)": {
      display: "none",
    },
  },
  secondaryContainer: {
    display: "flex",
    alignItems: "center",
  },
  audio: {
    marginLeft: 6,
    "& svg": {
      height: 13,
      margin: "3px -8px 0 3px",
    },
  },
  tag: {
    margin: "0 5px 0 15px",
  },
  comments: {
    minWidth: 58,
    marginLeft: 4,
    display: "flex",
    alignItems: "center",
    "& svg": {
      height: 18,
      marginRight: 1,
    },
    "&:hover": {
      color: theme.palette.grey[800],
      opacity: 1,
    },
    [theme.breakpoints.up("sm")]: {
      padding: '10px 0',
    }
  },
  newComments: {
    fontWeight: 700,
    color: theme.palette.grey[1000],
  },
  bookmark: {
    minWidth: 20,
    "&:hover": {
      opacity: 0.5,
    },
  },
  bookmarkIcon: {
    fontSize: 18,
    marginTop: 2,
    color: theme.palette.grey[600],
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  onlyMobile: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  expandedComments: {
    padding: "0 12px 8px",
  },
});

export type EAPostsListProps = PostsItemConfig & {
  classes: ClassesType,
};

const EAPostsItem = ({classes, ...props}: EAPostsListProps) => {
  const {
    post,
    postLink,
    tagRel,
    commentCount,
    hasUnreadComments,
    primaryTag,
    hasAudio,
    sticky,
    showDraftTag,
    showPersonalIcon,
    showTrailingButtons,
    showMostValuableCheckbox,
    showDismissButton,
    showArchiveButton,
    onDismiss,
    onArchive,
    resumeReading,
    strikethroughTitle,
    curatedIconLeft,
    isRead,
    showReadCheckbox,
    tooltipPlacement,
    toggleComments,
    renderComments,
    commentTerms,
    condensedAndHiddenComments,
    isRepeated,
    analyticsProps,
  } = usePostsItem(props);
  const {onClick} = useClickableCell(postLink);
  const authorExpandContainer = useRef(null);

  if (isRepeated) {
    return null;
  }

  const {
    PostsTitle, PostsItemDate, ForumIcon, BookmarkButton, PostsItemKarma, FooterTag,
    TruncatedAuthorsList, PostsItemTagRelevance, PostsItemTooltipWrapper,
    PostsItemTrailingButtons, PostReadCheckbox, PostsItemNewCommentsWrapper,
  } = Components;

  const SecondaryInfo = () => (
    <>
      <a onClick={toggleComments} className={classNames(
        classes.comments,
        {[classes.newComments]: hasUnreadComments},
      )}>
        <ForumIcon icon="Comment" />
        {commentCount}
      </a>
      <div className={classes.bookmark}>
        <a> {/* The `a` tag prevents clicks from navigating to the post */}
          <BookmarkButton post={post} className={classes.bookmarkIcon} />
        </a>
      </div>
    </>
  );

  const TitleWrapper: FC = ({children}) => (
    <PostsItemTooltipWrapper post={post} placement={tooltipPlacement} As="span">
      <Link to={postLink}>{children}</Link>
    </PostsItemTooltipWrapper>
  );

  return (
    <AnalyticsContext {...analyticsProps}>
      <div className={classes.root}>
        {showReadCheckbox &&
          <div className={classes.readCheckbox}>
            <PostReadCheckbox post={post} width={14} />
          </div>
        }
        <div className={classes.expandedCommentsWrapper}>
          <div className={classes.container} onClick={onClick}>
            <div className={classes.karma}>
              {tagRel
                ? <div className={classes.tagRelWrapper}>
                  <PostsItemTagRelevance tagRel={tagRel} post={post} />
                </div>
                : <>
                  <div className={classes.voteArrow}>
                    <SoftUpArrowIcon />
                  </div>
                  <PostsItemKarma post={post} />
                </>
              }
            </div>
            <div className={classes.details}>
              <PostsTitle
                {...{
                  post,
                  sticky,
                  showDraftTag,
                  showPersonalIcon,
                  strikethroughTitle,
                  curatedIconLeft,
                }}
                Wrapper={TitleWrapper}
                read={isRead && !showReadCheckbox}
                isLink={false}
                className={classes.title}
              />
              <div className={classes.meta}>
                <div className={classes.metaLeft} ref={authorExpandContainer}>
                  <TruncatedAuthorsList
                    post={post}
                    expandContainer={authorExpandContainer}
                  />
                  <div>
                    {' · '}
                    <PostsItemDate post={post} noStyles includeAgo />
                    <span className={classes.readTime}>
                      {' · '}{post.readTimeMinutes || 1}m read
                    </span>
                  </div>
                  <div className={classes.audio}>
                    {hasAudio && <ForumIcon icon="VolumeUp" />}
                  </div>
                </div>
                <div className={classNames(
                  classes.secondaryContainer,
                  classes.onlyMobile,
                )}>
                  <SecondaryInfo />
                </div>
              </div>
            </div>
            <div className={classNames(classes.secondaryContainer, classes.hideOnMobile)}>
              {/*
                * This is commented out for now as we'll likely experiment with
                * adding it back in the future
              <div className={classes.tag}>
                {primaryTag && !showReadCheckbox &&
                  <FooterTag tag={primaryTag} smallText />
                }
              </div>
                */}
              <SecondaryInfo />
            </div>
            <a> {/* The `a` tag prevents clicks from navigating to the post */}
              <PostsItemTrailingButtons
                {...{
                  post,
                  showTrailingButtons,
                  showMostValuableCheckbox,
                  showDismissButton,
                  showArchiveButton,
                  resumeReading,
                  onDismiss,
                  onArchive,
                }}
              />
            </a>
          </div>
          {renderComments &&
            <div className={classes.expandedComments}>
              <PostsItemNewCommentsWrapper
                terms={commentTerms}
                post={post}
                treeOptions={{
                  highlightDate: post.lastVisitedAt,
                  condensed: condensedAndHiddenComments,
                }}
              />
            </div>
          }
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAPostsItemComponent = registerComponent(
  "EAPostsItem",
  EAPostsItem,
  {
    styles,
    stylePriority: 1,
    hocs: [withErrorBoundary],
    areEqual: {
      terms: "deep",
    },
  },
);

declare global {
  interface ComponentTypes {
    EAPostsItem: typeof EAPostsItemComponent
  }
}
