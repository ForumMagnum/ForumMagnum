import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/constants';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting, isLW } from '@/lib/instanceSettings';
import { getReviewPhase, postEligibleForReview, postPassedNomination, REVIEW_YEAR, reviewIsActive } from '../../lib/reviewUtils';
import { PostsItemConfig, usePostsItem } from './usePostsItem';
import PostsItemTrailingButtons, { MENU_WIDTH, DismissButton } from './PostsItemTrailingButtons';
import DebateIcon from '@/lib/vendor/@material-ui/icons/src/Forum';
import { useHover } from '../common/withHover';
import { highlightMarket } from '@/lib/collections/posts/annualReviewMarkets';
import PostsItemTagRelevance from "../tagging/PostsItemTagRelevance";
import EventVicinity from "../localGroups/EventVicinity";
import PostsItemComments from "./PostsItemComments";
import KarmaDisplay from "../common/KarmaDisplay";
import PostsTitle from "./PostsTitle";
import PostsUserAndCoauthors from "./PostsUserAndCoauthors";
import LWTooltip from "../common/LWTooltip";
import PostActionsButton from "../dropdowns/posts/PostActionsButton";
import { PostsItemIcons } from "./PostsItemIcons";
import PostsItem2MetaInfo from "./PostsItem2MetaInfo";
import PostsItemTooltipWrapper from "./PostsItemTooltipWrapper";
import BookmarkButton from "./BookmarkButton";
import PostsItemDate from "./PostsItemDate";
import PostsItemNewCommentsWrapper from "./PostsItemNewCommentsWrapper";
import PostsItemNewDialogueResponses from "./PostsItemNewDialogueResponses";
import AnalyticsTracker from "../common/AnalyticsTracker";
import AddToCalendarButton from "./AddToCalendar/AddToCalendarButton";
import PostsItemReviewVote from "../review/PostsItemReviewVote";
import ReviewPostButton from "../review/ReviewPostButton";
import PostReadCheckbox from "./PostReadCheckbox";
import PostMostValuableCheckbox from "./PostMostValuableCheckbox";
import { ResponseIcon } from "./PostsPage/RSVPs";
import { maybeDate } from '@/lib/utils/dateUtils';
import { isIfAnyoneBuildsItFrontPage } from '../seasonal/styles';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const KARMA_WIDTH = 32;

export const styles = defineStyles("LWPostsItem", (theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    
    // On the If Anyone Builds It front page, replace the 2px bottom border
    // with a rectangular element with a blur, so the background can show
    // through.
    // This breaks the layout on Sequence pages (where the component is already
    // a horizontal flexbox)
    ...isIfAnyoneBuildsItFrontPage({
      flexDirection: "column",
      '&::after': {
        height: 2,
        content: '""',
        width: '100%',
        backdropFilter: theme.palette.filters.bannerAdBlur,
      },
    }),
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
    ...(theme.isBookUI && theme.dark && {
      background: theme.palette.panelBackground.bannerAdTranslucent,
      backdropFilter: theme.palette.filters.bannerAdBlur,
      ...isIfAnyoneBuildsItFrontPage({
        background: theme.palette.panelBackground.bannerAdTranslucentDeep,
      })
    })
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
    paddingLeft: 6,
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
      ...(theme.isBookUI && theme.dark && {
        backgroundColor: theme.palette.panelBackground.bannerAdTranslucentHeavy,
      }),
    },
  },
  hasSmallSubtitle: {
    '&&': {
      top: -5,
    }
  },
  hasSequenceImage: {
    paddingRight: 0,
  },
  bottomBorder: {
    borderBottom: theme.palette.border.itemSeparatorBottom,
    ...isIfAnyoneBuildsItFrontPage({
      borderBottom: "none",
    }),
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
    marginRight: 4,
    [theme.breakpoints.down('xs')]:{
      width: "unset",
      justifyContent: "flex-start",
      marginLeft: 2,
      marginRight: theme.spacing.unit
    }
  },
  karmaPredictedReviewWinner: {
    color: theme.palette.review.winner
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
    ...isIfAnyoneBuildsItFrontPage({
      color: theme.palette.text.bannerAdDim,
    }),
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
    height: 24,
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
  mobileIcons: {
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
    height: 22,
  },
  isRead: {
    ...isIfAnyoneBuildsItFrontPage({
      background: theme.palette.panelBackground.bannerAdTranslucent,
      backdropFilter: theme.palette.filters.bannerAdBlur,
    }),
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
    marginLeft: 10,
    [theme.breakpoints.down('xs')]: {
      marginRight: -8,
    }
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
  }, 
  unreadDebateResponseContainer: {
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.5
    }
  },
  rsvps: {
    position: "relative",
    top: 2,
    [theme.breakpoints.down('xs')]: {
      marginRight: 16,
    },
  },
  rsvpCount: {
    position: "relative",
    top: -2,
    fontSize: "1rem",
    fontWeight: 300,
    color: theme.palette.greyAlpha(0.9),
  },
  afterSpacerWrap: {
    [theme.breakpoints.down('xs')]: {
      flexBasis: '100%',
    },
  },
  tertiaryRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    flexShrink: 0,
  },
}), { stylePriority: 1 });

export type PostsList2Props = PostsItemConfig;

const LWPostsItem = (props: PostsItemConfig) => {
  const {
    post,
    postLink,
    commentCount,
    tagRel,
    resumeReading,
    sticky,
    renderComments,
    renderDialogueMessages,
    condensedAndHiddenComments,
    toggleComments,
    toggleDialogueMessages,
    showAuthor,
    showDate,
    showTrailingButtons,
    showMostValuableCheckbox,
    showNominationCount,
    showReviewCount,
    showIcons,
    showKarma,
    useCuratedDate,
    annualReviewMarketInfo,
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
    analyticsProps,
    translucentBackground,
    isRead,
    tooltipPlacement,
    dense,
    curatedIconLeft,
    strikethroughTitle,
    bookmark,
    emphasizeIfNew,
    className,
  } = usePostsItem(props);

  const classes = useStyles(styles);
  const { hover, eventHandlers } = useHover();

  const reviewCountsTooltip = `${post.nominationCount2019 || 0} nomination${(post.nominationCount2019 === 1) ? "" :"s"} / ${post.reviewCount2019 || 0} review${(post.nominationCount2019 === 1) ? "" :"s"}`

  const reviewIsActive = getReviewPhase() === "REVIEWS" || getReviewPhase() === "NOMINATIONS" || getReviewPhase() === "VOTING";

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
          <div {...eventHandlers}>
            <PostsItemTooltipWrapper
              post={post}
              placement={tooltipPlacement}
              className={classNames(
                classes.postsItem,
                classes.withGrayHover, {
                  [classes.dense]: dense,
                  [classes.withRelevanceVoting]: !!tagRel,
                  [classes.hasSequenceImage]: !!resumeReading,
                }
              )}
            >
              {tagRel && <PostsItemTagRelevance tagRel={tagRel} />}
              {showKarma && <PostsItem2MetaInfo className={classNames(
                classes.karma, {
                  [classes.karmaPredictedReviewWinner]: highlightMarket(annualReviewMarketInfo)
                })}>
                {post.isEvent
                  ? <AddToCalendarButton post={post} />
                  : <KarmaDisplay document={post} />
                }
              </PostsItem2MetaInfo>}

              <span className={classNames(classes.title, {[classes.hasSmallSubtitle]: !!resumeReading})}>
                <AnalyticsTracker
                    eventType={"postItem"}
                    eventProps={{mountedPostId: post._id, mountedPostScore: post.score, mountedPostBaseScore: post.baseScore}}
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
                    postItemHovered={hover}
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

              {post.isEvent && !post.onlineEvent && <PostsItem2MetaInfo className={classes.event}>
                <EventVicinity post={post} />
              </PostsItem2MetaInfo>}
              {/* space in-between title and author if there is width remaining */}
              <span className={classes.spacer} />

              {isLW() && post.isEvent && post.rsvpCounts?.yes>=5 && <PostsItem2MetaInfo className={classes.rsvps}>
                {post.rsvpCounts?.yes && <>
                  <ResponseIcon response="yes"/>
                  <span className={classes.rsvpCount}>{post.rsvpCounts.yes}</span>
                </>}
                {post.rsvpCounts?.maybe && <>
                  <ResponseIcon response="maybe"/>
                  <span className={classes.rsvpCount}>{post.rsvpCounts.maybe}</span>
                </>}
              </PostsItem2MetaInfo>}

              {showAuthor && <PostsItem2MetaInfo className={classes.author}>
                <PostsUserAndCoauthors post={post} abbreviateIfLong={true} newPromotedComments={hasNewPromotedComments} tooltipPlacement="top"/>
              </PostsItem2MetaInfo>}

              {!!post.unreadDebateResponseCount && <PostsItem2MetaInfo className={classes.unreadDebateResponseContainer}>
                <div className={classes.unreadDebateResponseCount} onClick={!!post.collabEditorDialogue ? toggleDialogueMessages : toggleComments}>
                  <DebateIcon className={classes.unreadDebateResponsesIcon}/>
                  {post.unreadDebateResponseCount}
                </div>
              </PostsItem2MetaInfo>}

              {showDate && <PostsItemDate post={post} useCuratedDate={useCuratedDate} emphasizeIfNew={emphasizeIfNew} />}

              <div className={classes.mobileSecondRowSpacer}/>
              <div className={classes.tertiaryRow}>
                {reviewIsActive && <div className={classes.mobileSecondRowSpacer}/>}
                {showIcons && <div className={classes.mobileIcons}>
                  <PostsItemIcons post={post} />
                </div>}

                {<div className={classes.mobileActions}>
                  {!resumeReading && <PostActionsButton post={post} autoPlace />}
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

                {postEligibleForReview(post) && postPassedNomination(post) && getReviewPhase() === "REVIEWS" && <span className={classes.reviewPostButton}>
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
              </div>
              {bookmark && <div className={classes.bookmark}>
                <BookmarkButton documentId={post._id} collectionName="Posts"/>
              </div>}
              <div className={classes.mobileDismissButton}>
                {showDismissButton && <DismissButton {...{showDismissButton, onDismiss}} />}
              </div>

              {resumeReading &&
                <div className={classes.sequenceImage}>
                  <img className={classes.sequenceImageImg}
                    src={`https://res.cloudinary.com/${cloudinaryCloudNameSetting.get()}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
                      resumeReading.sequence?.gridImageId
                        || resumeReading.collection?.gridImageId
                        || "sequences/vnyzzznenju0hzdv6pqb.jpg"
                    }`}
                  />
                </div>
              }
            </PostsItemTooltipWrapper>
          </div>

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
                highlightDate: maybeDate(post.lastVisitedAt ?? undefined),
                condensed: condensedAndHiddenComments,
              }}
            />
          </div>}

          {renderDialogueMessages && <div className={classes.newCommentsSection} onClick={toggleDialogueMessages}>
            <PostsItemNewDialogueResponses postId={post._id} unreadCount={post.unreadDebateResponseCount} />
          </div>}
        </div>
        {showMostValuableCheckbox && <div className={classes.mostValuableCheckbox}>
          <PostMostValuableCheckbox post={post} />
        </div>}
      </div>
    </AnalyticsContext>
  )
};

export default registerComponent('LWPostsItem', LWPostsItem, {
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});


