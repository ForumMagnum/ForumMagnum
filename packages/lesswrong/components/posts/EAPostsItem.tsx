import React, { FC, PropsWithChildren } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { usePostsItem, PostsItemConfig } from "./usePostsItem";
import { Link } from "../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import withErrorBoundary from "../common/withErrorBoundary";
import classNames from "classnames";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { cloudinaryCloudNameSetting } from "../../lib/publicSettings";
import { usePostContents } from "../hooks/useForeignCrosspost";

const KARMA_WIDTH = 50;

export const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: SECTION_WIDTH,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  rootCard: {
    marginBottom: 2,
  },
  readCheckbox: {
    minWidth: 24,
    [theme.breakpoints.down("xs")]: {
      marginLeft: -12,
    },
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
    padding: "8px 12px 8px 0",
    fontWeight: 500,
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      paddingRight: 12,
    },
  },
  containerCard: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  containerCardWithImage: {
    paddingBottom: 0,
  },
  postsVote: {
    position: "relative",
    fontSize: 30,
    textAlign: "center",
    "& .PostsVoteDefault-voteBlock": {
      marginTop: -5,
    },
  },
  tagRelWrapper: {
    position: "relative",
    transform: "translateY(1px)",
    marginLeft: 44,
    marginRight: 14,
  },
  details: {
    flexGrow: 1,
    minWidth: 0, // flexbox black magic
  },
  titleWrapper: {
    display: "inline",
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
  secondaryContainer: {
    display: "flex",
    alignItems: "center",
  },
  secondaryContainerCard: {
    alignSelf: "flex-start",
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
  commentsCard: {
    [theme.breakpoints.up("sm")]: {
      padding: 0,
    },
  },
  newComments: {
    fontWeight: 700,
    color: theme.palette.grey[1000],
  },
  postActions: {
    minWidth: 20,
    marginLeft: -5,
    "& .PostActionsButton-icon": {
      fontSize: 20,
    },
    "&:hover .PostActionsButton-icon": {
      color: theme.palette.grey[700],
    },
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
  interactionWrapper: {
    "&:hover": {
      opacity: 1,
    },
  },
  karmaDisplay: {
    width: KARMA_WIDTH,
    minWidth: KARMA_WIDTH,
  },
  card: {
    padding: `0 20px 16px ${KARMA_WIDTH}px`,
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-end",
    gap: "70px",
    [theme.breakpoints.down("xs")]: {
      gap: "12px",
    },
  },
  cardText: {
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
    overflow: "hidden",
    flexGrow: 1,
    fontWeight: 500,
    fontSize: 13,
    lineHeight: "150%",
    color: theme.palette.grey[600],
    maxHeight: 70,
    [theme.breakpoints.down("xs")]: {
      "-webkit-line-clamp": 4,
      lineHeight: "140%",
    },
  },
  cardTextWithImage: {
    marginTop: 12,
  },
  cardTextNoImage: {
    marginRight: 30,
  },
  cardImage: {
    borderRadius: theme.borderRadius.small,
    width: 124,
    minWidth: 124,
    height: 70,
    minHeight: 70,
    objectFit: "cover",
    [theme.breakpoints.down("xs")]: {
      width: 100,
      minWidth: 100,
    },
  },
});

const cloudinaryBase = `${cloudinaryCloudNameSetting.get()}/image/upload/`;

const formatImageUrl = (url: string) =>
  url.replace(cloudinaryBase, `${cloudinaryBase}c_fill,w_124,h_70,dpr_2,`);

export type EAPostsItemProps = PostsItemConfig & {
  hideSecondaryInfo?: boolean,
  classes: ClassesType<typeof styles>,
};

const EAPostsItem = ({
  hideSecondaryInfo,
  classes,
  ...props
}: EAPostsItemProps) => {
  const {
    post,
    postLink,
    tagRel,
    commentCount,
    hasUnreadComments,
    sticky,
    showDraftTag,
    showPersonalIcon,
    showTrailingButtons,
    showMostValuableCheckbox,
    showDismissButton,
    onDismiss,
    onArchive,
    resumeReading,
    strikethroughTitle,
    curatedIconLeft,
    showIcons,
    isRead,
    showReadCheckbox,
    tooltipPlacement,
    toggleComments,
    renderComments,
    commentTerms,
    condensedAndHiddenComments,
    isRepeated,
    analyticsProps,
    viewType,
    isVoteable,
    useCuratedDate,
    className,
  } = usePostsItem(props);
  const {onClick} = useClickableCell({href: postLink});
  const cardView = viewType === "card";
  const {postContents} = usePostContents({
    post,
    fragmentName: "PostsList",
    skip: !cardView,
  });

  if (isRepeated) {
    return null;
  }

  const {
    PostsTitle, ForumIcon, PostActionsButton, EAKarmaDisplay, EAPostMeta,
    PostsItemTagRelevance, PostsItemTooltipWrapper, PostsVote,
    PostsItemTrailingButtons, PostReadCheckbox, PostsItemNewCommentsWrapper,
    PostMostValuableCheckbox,
  } = Components;

  const SecondaryInfo = () => (hideSecondaryInfo || showMostValuableCheckbox) ? null : (
    <>
      <InteractionWrapper className={classes.interactionWrapper}>
        <a onClick={toggleComments} className={classNames(
          classes.comments,
          cardView && classes.commentsCard,
          hasUnreadComments && classes.newComments,
        )}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </a>
      </InteractionWrapper>
      <div className={classes.postActions}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <PostActionsButton post={post} popperGap={16} autoPlace vertical />
        </InteractionWrapper>
      </div>
      {tagRel &&
        <div className={classes.tagRelWrapper}>
          <InteractionWrapper className={classes.interactionWrapper}>
            <PostsItemTagRelevance tagRel={tagRel} />
          </InteractionWrapper>
        </div>
      }
    </>
  );

  // The nesting here gets a little messy: we need to add the extra `Link`
  // around the title to make it right-clickable/cmd+clickable. However,
  // clicking this adds a second history item when navigating to the post
  // normally requiring the user to press back twice to get to where they
  // started so we need to wrap that whole thing in an `InteractionWrapper`
  // too.
  const TitleWrapper: FC<PropsWithChildren<{}>> = ({children}) => (
    <PostsItemTooltipWrapper post={post} placement={tooltipPlacement} As="span">
      <InteractionWrapper className={classes.titleWrapper}>
        <Link to={postLink}>{children}</Link>
      </InteractionWrapper>
    </PostsItemTooltipWrapper>
  );

  const body =
    postContents?.plaintextDescription ||
    post.contents?.plaintextDescription ||
    "";
  const hasBody = body.trim().length > 0;
  const hasImage = !!post.socialPreviewData.imageUrl;

  return (
    <AnalyticsContext {...analyticsProps}>
      <div className={classNames(
        classes.root,
        cardView && classes.rootCard,
        className,
      )}>
        {showReadCheckbox &&
          <div className={classes.readCheckbox}>
            <PostReadCheckbox post={post} width={14} />
          </div>
        }
        <div className={classes.expandedCommentsWrapper}>
          <div onClick={onClick} className={classNames(
            classes.container,
            cardView && classes.containerCard,
            cardView && post.socialPreviewData.imageUrl && classes.containerCardWithImage,
          )}>
            {isVoteable
              ? (
                <InteractionWrapper className={classNames(
                  classes.interactionWrapper,
                  classes.postsVote,
                )}>
                  <PostsVote post={post} />
                </InteractionWrapper>
              )
              : (
                <EAKarmaDisplay post={post} className={classes.karmaDisplay} />
              )
            }
            <div className={classes.details}>
              <PostsTitle
                {...{
                  post,
                  sticky,
                  showDraftTag,
                  showPersonalIcon,
                  strikethroughTitle,
                  curatedIconLeft,
                  showIcons,
                }}
                Wrapper={TitleWrapper}
                read={isRead && !showReadCheckbox}
                isLink={false}
                showEventTag
                className={classes.title}
              />
              <div className={classes.meta}>
                <EAPostMeta post={post} useCuratedDate={useCuratedDate} />
                <div className={classNames(
                  classes.secondaryContainer,
                  classes.onlyMobile,
                )}>
                  <SecondaryInfo />
                </div>
              </div>
            </div>
            <div className={classNames(
              classes.secondaryContainer,
              cardView && classes.secondaryContainerCard,
              classes.hideOnMobile,
            )}>
              <SecondaryInfo />
            </div>
            {showMostValuableCheckbox && <div className={classes.secondaryContainer}>
              <InteractionWrapper className={classes.interactionWrapper}>
                <PostMostValuableCheckbox post={post} />
              </InteractionWrapper>
            </div>}
            <InteractionWrapper className={classes.interactionWrapper}>
              <PostsItemTrailingButtons
                showArchiveButton={false}
                {...{
                  post,
                  showTrailingButtons,
                  showMostValuableCheckbox,
                  showDismissButton,
                  resumeReading,
                  onDismiss,
                  onArchive,
                }}
              />
            </InteractionWrapper>
          </div>
          {cardView && (hasBody || hasImage) &&
            <div className={classes.card} onClick={onClick}>
              <div className={classNames(
                classes.cardText,
                hasImage && classes.cardTextWithImage,
                !hasImage && classes.cardTextNoImage,
              )}>
                {body}
              </div>
              {hasImage &&
                <img
                  src={formatImageUrl(post.socialPreviewData.imageUrl)}
                  alt={post.title}
                  className={classes.cardImage}
                />
              }
            </div>
          }
          {renderComments &&
            <div className={classes.expandedComments}>
              <PostsItemNewCommentsWrapper
                terms={commentTerms}
                post={post}
                treeOptions={{
                  highlightDate: post.lastVisitedAt ?? undefined,
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
