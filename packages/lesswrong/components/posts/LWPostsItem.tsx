import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection'
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { getReviewPhase, postEligibleForReview, postIsVoteable, REVIEW_YEAR } from '../../lib/reviewUtils';
import { PostsItemConfig, usePostsItem } from './usePostsItem';
import { MENU_WIDTH, DismissButton } from './PostsItemTrailingButtons';
import DebateIcon from '@material-ui/icons/Forum';

export const KARMA_WIDTH = 32

export const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  root: {
    position: "relative",
    minWidth: 0,
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    },
    '&:hover .PostsItemTrailingButtons-actions': {
      opacity: .2,
    },
    '&:hover .PostsItemTrailingButtons-archiveButton': {
      opacity: .2,
    }
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  checkboxWidth: {
    width: "calc(100% - 24px)"
  },
  translucentBackground: {
    width: "100%",
    background: theme.palette.panelBackground.translucent,
    backdropFilter: "blur(1px)"
  },
  postsItem: {
    display: "flex",
    position: "relative",
    padding: 10,
    alignItems: "center",
    flexWrap: "nowrap",
    [theme.breakpoints.down('xs')]: {
      flexWrap: "wrap",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
      paddingLeft: 5
    },
  },
  withGrayHover: {
    '&:hover': {
      backgroundColor: theme.palette.panelBackground.postsItemHover,
    },
  },
  hasSmallSubtitle: {
    '&&': {
      top: -5,
    }
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
  },
  commentsBackground: {
    backgroundColor: theme.palette.panelBackground.postsItemExpandedComments,
    [theme.breakpoints.down('xs')]: {
      paddingLeft: theme.spacing.unit/2,
      paddingRight: theme.spacing.unit/2
    }
  },
  karma: {
    width: KARMA_WIDTH,
    justifyContent: "center",
    [theme.breakpoints.down('xs')]:{
      width: "unset",
      justifyContent: "flex-start",
      marginLeft: 2,
      marginRight: theme.spacing.unit
    }
  },
  title: {
    minHeight: 26,
    flex: 1500,
    maxWidth: "fit-content",
    overflow: "hidden",
    textOverflow: "ellipsis",
    marginRight: 12,
    [theme.breakpoints.up('sm')]: {
      position: "relative",
      top: 3,
    },
    [theme.breakpoints.down('xs')]: {
      order:-1,
      height: "unset",
      maxWidth: "unset",
      width: "100%",
      paddingRight: theme.spacing.unit,
      flex: "unset",
    },
    '&:hover': {
      opacity: 1,
    }
  },
  spacer: {
    flex: 1,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  author: {
    justifyContent: "flex",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    zIndex: theme.zIndexes.postItemAuthor,
    flex: 1000,
    maxWidth: "fit-content",
    [theme.breakpoints.down('xs')]: {
      justifyContent: "flex-end",
      width: "unset",
      marginLeft: 0,
      flex: "unset"
    }
  },
  event: {
    maxWidth: 250,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    [theme.breakpoints.down('xs')]: {
      width: "unset",
      marginLeft: 0,
    }
  },
  newCommentsSection: {
    width: "100%",
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    paddingTop: theme.spacing.unit,
    cursor: "pointer",
    marginBottom: NEW_COMMENT_MARGIN_BOTTOM,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
    }
  },
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -MENU_WIDTH - 6,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  archiveButton: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 1,
    right: -3*MENU_WIDTH,
    width: MENU_WIDTH,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  mobileSecondRowSpacer: {
    [theme.breakpoints.up('sm')]: {
      display: "none",
    },
    flexGrow: 1,
  },
  mobileActions: {
    cursor: "pointer",
    width: MENU_WIDTH,
    opacity: .5,
    marginRight: theme.spacing.unit,
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block"
    }
  },
  nonMobileIcons: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    }
  },
  mobileDismissButton: {
    display: "none",
    opacity: 0.75,
    verticalAlign: "middle",
    position: "relative",
    cursor: "pointer",
    right: 10,
    [theme.breakpoints.down('xs')]: {
      display: "inline-block"
    }
  },
  subtitle: {
    color: theme.palette.grey[700],
    fontFamily: theme.typography.commentStyle.fontFamily,

    [theme.breakpoints.up('sm')]: {
      position: "absolute",
      left: 42,
      bottom: 5,
      zIndex: theme.zIndexes.nextUnread,
    },
    [theme.breakpoints.down('xs')]: {
      order: -1,
      width: "100%",
      marginTop: -2,
      marginBottom: 3,
      marginLeft: 1,
    },
    "& a": {
      color: theme.palette.primary.main,
    },
  },
  sequenceImage: {
    position: "relative",
    marginLeft: -60,
    opacity: 0.6,
    height: 48,
    width: 146,

    // Negative margins that are the opposite of the padding on postsItem, since
    // the image extends into the padding.
    marginTop: -12,
    marginBottom: -12,
    [theme.breakpoints.down('xs')]: {
      marginTop: 0,
      marginBottom: 0,
      position: "absolute",
      overflow: 'hidden',
      right: 0,
      bottom: 0,
      height: "100%",
    },

    // Overlay a white-to-transparent gradient over the image
    "&:after": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      background: `linear-gradient(to right, ${theme.palette.panelBackground.default} 0%, ${theme.palette.panelBackground.translucent2} 60%, transparent 100%)`,
    }
  },
  sequenceImageImg: {
    height: 48,
    width: 146,
    [theme.breakpoints.down('xs')]: {
      height: "100%",
      width: 'auto'
    },
  },
  reviewCounts: {
    width: 50
  },
  noReviews: {
    color: theme.palette.grey[400]
  },
  dense: {
    paddingTop: 7,
    paddingBottom:8
  },
  withRelevanceVoting: {
      marginLeft: 28
  },
  bookmark: {
    marginLeft: theme.spacing.unit/2,
    marginRight: theme.spacing.unit*1.5,
    position: "relative",
    top: 2,
  },
  isRead: {
    // this is just a placeholder, enabling easier theming.
  },
  checkbox: {
    marginRight: 10
  },
  mostValuableCheckbox: {
    marginLeft: 5
  },
  commentsIcon: {
    marginLeft: 8
  },
  reviewPostButton: {
    marginLeft: 10
  },
  unreadDebateResponsesIcon: {
    height: 14,
    position: 'relative',
    top: 2,
    color: theme.palette.primary.main
  },
  unreadDebateResponseCount: {
    paddingLeft: 4,
    color: theme.palette.primary.main
  }
})

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

export type PostsList2Props = PostsItemConfig & {
  classes: ClassesType,
};

const LWPostsItem = ({classes, ...props}: PostsList2Props) => {
  const {
    post,
    postLink,
    commentCount,
    tagRel,
    resumeReading,
    sticky,
    renderComments,
    condensedAndHiddenComments,
    toggleComments,
    showAuthor,
    showDate,
    showTrailingButtons,
    showMostValuableCheckbox,
    showNominationCount,
    showReviewCount,
    showIcons,
    showKarma,
    showReadCheckbox,
    showDraftTag,
    showPersonalIcon,
    showBottomBorder,
    showDismissButton,
    showArchiveButton,
    onDismiss,
    onArchive,
    hasUnreadComments,
    hasNewPromotedComments,
    commentTerms,
    isRepeated,
    analyticsProps,
    translucentBackground,
    isRead,
    tooltipPlacement,
    dense,
    curatedIconLeft,
    strikethroughTitle,
    bookmark,
    className,
  } = usePostsItem(props);

  if (isRepeated) {
    return null;
  }

  const {
    PostsItemComments, KarmaDisplay, PostsTitle, PostsUserAndCoauthors, LWTooltip,
    PostActionsButton, PostsItemIcons, PostsItem2MetaInfo, PostsItemTooltipWrapper,
    BookmarkButton, PostsItemDate, PostsItemNewCommentsWrapper, AnalyticsTracker,
    AddToCalendarButton, PostsItemReviewVote, ReviewPostButton, PostReadCheckbox,
    PostMostValuableCheckbox, PostsItemTrailingButtons,
  } = Components;

  const reviewCountsTooltip = `${post.nominationCount2019 || 0} nomination${(post.nominationCount2019 === 1) ? "" :"s"} / ${post.reviewCount2019 || 0} review${(post.nominationCount2019 === 1) ? "" :"s"}`

  return (
    <AnalyticsContext {...analyticsProps}>
      <div className={classes.row}>
        {showReadCheckbox && <div className={classes.checkbox}>
          <PostReadCheckbox post={post} width={14} />
        </div>}
        <div className={classNames(
          classes.root,
          className,
          {
            [classes.background]: !translucentBackground,
            [classes.checkboxWidth]: showReadCheckbox,
            [classes.translucentBackground]: translucentBackground,
            [classes.bottomBorder]: showBottomBorder,
            [classes.commentsBackground]: renderComments,
            [classes.isRead]: isRead && !showReadCheckbox  // readCheckbox and post-title read-status don't aesthetically match
          })}
        >
          <PostsItemTooltipWrapper
            post={post}
            placement={tooltipPlacement}
            className={classNames(
              classes.postsItem,
              classes.withGrayHover, {
                [classes.dense]: dense,
                [classes.withRelevanceVoting]: !!tagRel
              }
            )}
          >
            {tagRel && <Components.PostsItemTagRelevance tagRel={tagRel} />}
            {showKarma && <PostsItem2MetaInfo className={classes.karma}>
              {post.isEvent
                ? <AddToCalendarButton post={post} />
                : <KarmaDisplay document={post} />
              }
            </PostsItem2MetaInfo>}

            <span className={classNames(classes.title, {[classes.hasSmallSubtitle]: !!resumeReading})}>
              <AnalyticsTracker
                  eventType={"postItem"}
                  captureOnMount={(eventData) => eventData.capturePostItemOnMount}
                  captureOnClick={false}
              >
                <PostsTitle
                  postLink={postLink}
                  post={post}
                  read={isRead && !showReadCheckbox} // readCheckbox and post-title read-status don't aesthetically match
                  sticky={sticky}
                  showDraftTag={showDraftTag}
                  {...(showPersonalIcon ? {showPersonalIcon} : {})}
                  curatedIconLeft={curatedIconLeft}
                  strikethroughTitle={strikethroughTitle}
                />
              </AnalyticsTracker>
            </span>

            {(resumeReading?.sequence || resumeReading?.collection) &&
              <div className={classes.subtitle}>
                {resumeReading.numRead ? "Next unread in " : "First post in "}<Link to={
                  resumeReading.sequence
                    ? sequenceGetPageUrl(resumeReading.sequence)
                    : collectionGetPageUrl(resumeReading.collection)
                }>
                  {resumeReading.sequence ? resumeReading.sequence.title : resumeReading.collection?.title}
                </Link>
                {" "}
                {(resumeReading.numRead>0) && <span>({resumeReading.numRead}/{resumeReading.numTotal} read)</span>}
              </div>
            }

            { post.isEvent && !post.onlineEvent && <PostsItem2MetaInfo className={classes.event}>
              <Components.EventVicinity post={post} />
            </PostsItem2MetaInfo>}

            {/* space in-between title and author if there is width remaining */}
            <span className={classes.spacer} />

            {showAuthor && <PostsItem2MetaInfo className={classes.author}>
              <PostsUserAndCoauthors post={post} abbreviateIfLong={true} newPromotedComments={hasNewPromotedComments} tooltipPlacement="top"/>
            </PostsItem2MetaInfo>}

            {!!post.unreadDebateResponseCount && <PostsItem2MetaInfo>
              <div className={classes.unreadDebateResponseCount}>
                <DebateIcon className={classes.unreadDebateResponsesIcon}/>
                {post.unreadDebateResponseCount}
              </div>
            </PostsItem2MetaInfo>}

            {showDate && <PostsItemDate post={post} />}

            <div className={classes.mobileSecondRowSpacer}/>

            {<div className={classes.mobileActions}>
              {!resumeReading && <PostActionsButton post={post} />}
            </div>}

            {showIcons && <div className={classes.nonMobileIcons}>
              <PostsItemIcons post={post}/>
            </div>}

            {!resumeReading && <div className={classes.commentsIcon}>
              <PostsItemComments
                small={false}
                commentCount={commentCount}
                onClick={toggleComments}
                unreadComments={hasUnreadComments}
                newPromotedComments={hasNewPromotedComments}
              />
            </div>}

            {getReviewPhase() === "NOMINATIONS" && <PostsItemReviewVote post={post}/>}

            {postEligibleForReview(post) && postIsVoteable(post)  && getReviewPhase() === "REVIEWS" && <span className={classes.reviewPostButton}>
              <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={<div><div>What was good about this post? How it could be improved? Does it stand the test of time?</div><p><em>{post.reviewCount || "No"} review{post.reviewCount !== 1 && "s"}</em></p></div>} placement="top">
              Review
            </LWTooltip>}/></span>}

            {(showNominationCount || showReviewCount) && <LWTooltip title={reviewCountsTooltip} placement="top">

              <PostsItem2MetaInfo className={classes.reviewCounts}>
                {showNominationCount && <span>{post.nominationCount2019 || 0}</span>}
                {/* TODO:(Review) still 2019 */}
                {showReviewCount && <span>{" "}<span className={classes.noReviews}>{" "}•{" "}</span>{post.reviewCount2019 || <span className={classes.noReviews}>0</span>}</span>}
              </PostsItem2MetaInfo>

            </LWTooltip>}
            {bookmark && <div className={classes.bookmark}>
              <BookmarkButton post={post}/>
            </div>}
            <div className={classes.mobileDismissButton}>
              <DismissButton {...{showDismissButton, onDismiss}} />
            </div>

            {resumeReading &&
              <div className={classes.sequenceImage}>
                <img className={classes.sequenceImageImg}
                  src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
                    resumeReading.sequence?.gridImageId
                      || resumeReading.collection?.gridImageId
                      || "sequences/vnyzzznenju0hzdv6pqb.jpg"
                  }`}
                />
              </div>
            }
          </PostsItemTooltipWrapper>

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

          {renderComments && <div className={classes.newCommentsSection} onClick={toggleComments}>
            <PostsItemNewCommentsWrapper
              terms={commentTerms}
              post={post}
              treeOptions={{
                highlightDate: post.lastVisitedAt,
                condensed: condensedAndHiddenComments,
              }}
            />
          </div>}
        </div>
        {showMostValuableCheckbox && <div className={classes.mostValuableCheckbox}>
          <PostMostValuableCheckbox post={post} />
        </div>}
      </div>
    </AnalyticsContext>
  )
};

const LWPostsItemComponent = registerComponent('LWPostsItem', LWPostsItem, {
  styles,
  stylePriority: 1,
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    LWPostsItem: typeof LWPostsItemComponent
  }
}
