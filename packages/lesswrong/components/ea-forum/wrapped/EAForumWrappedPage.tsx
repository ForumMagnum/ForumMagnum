import React, { Fragment, useEffect, useRef, useState } from "react"
import { Components, registerComponent } from "../../../lib/vulcan-lib";
import { useCurrentUser } from "../../common/withUser";
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { WrappedDataByYear, WrappedMostReadAuthor, WrappedMostReadTopic, WrappedReceivedReact, WrappedRelativeMostReadCoreTopic, WrappedTopComment, WrappedTopPost, WrappedTopShortform, WrappedYear, isWrappedYear, useForumWrapped } from "./hooks";
import classNames from "classnames";
import range from "lodash/range";
import moment from "moment";
import { BarChart, Bar, ResponsiveContainer, YAxis, XAxis, AreaChart, Area, LineChart, Line } from "recharts";
import { requireCssVar } from "../../../themes/cssVars";
import { drawnArrow } from "../../icons/drawnArrow";
import { Link } from "../../../lib/reactRouterWrapper";
import { userGetProfileUrlFromSlug } from "../../../lib/collections/users/helpers";
import { postGetPageUrl } from "../../../lib/collections/posts/helpers";
import { SoftUpArrowIcon } from "../../icons/softUpArrowIcon";
import { eaEmojiPalette } from "../../../lib/voting/eaEmojiPalette";
import { userCanStartConversations } from "../../../lib/collections/conversations/collection";
import { useInitiateConversation } from "../../hooks/useInitiateConversation";
import { isClient } from "../../../lib/executionEnvironment";
import { InteractionWrapper, useClickableCell } from "../../common/useClickableCell";
import { isPostWithForeignId } from "../../hooks/useForeignCrosspost";
import { ExpandedDate } from "../../common/FormatDate";
import { useCommentLink } from "../../comments/CommentsItem/useCommentLink";
import { htmlToTextDefault } from "../../../lib/htmlToText";
import { HEADER_HEIGHT } from "../../common/Header";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";
import { lightbulbIcon } from "../../icons/lightbulbIcon";
import { HeartReactionIcon } from "../../icons/reactions/HeartReactionIcon";
import { tagGetUrl } from "../../../lib/collections/tags/helpers";
import { TagCommentType } from "../../../lib/collections/comments/types";
import { useLocation } from "../../../lib/routeUtil";
import DeferRender from "@/components/common/DeferRender";

const socialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const styles = (theme: ThemeType) => ({
  root: {
    minHeight: '100vh',
    background: theme.palette.wrapped.background,
    color: theme.palette.text.alwaysWhite,
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    marginTop: -theme.spacing.mainLayoutPaddingTop - HEADER_HEIGHT, // compensate for the padding added in Layout.tsx and the site header, so that section starts at the top of the page
    [theme.breakpoints.down('sm')]: {
      marginLeft: -8,
      marginRight: -8,
    },
  },
  loginWrapper: {
    marginTop: 30
  },
  loginText: {
    display: 'inline-block',
    width: '100%',
    maxWidth: 600,
    fontSize: 16,
    lineHeight: '24px',
    fontWeight: 500,
    margin: '0 auto',
  },
  loginImgWrapper: {
    display: 'inline-block',
    margin: '30px auto 0'
  },
  '@keyframes section-scroll-animation': {
    '0%': {
      opacity: 0,
    },
    '50%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    }
  },
  section: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '55vh',
    padding: '75px 40px',
    // Fade sections in and out if possible (i.e. on Chrome)
    '@supports (animation-timeline: view())': {
      animation: 'section-scroll-animation linear',
      animationTimeline: 'view()',
    },
    // If not, then make them taller so that they don't distract from the focused section
    '@supports not (animation-timeline: view())': {
      minHeight: '80vh',
    },
    '&:first-of-type': {
      minHeight: '85vh',
      paddingTop: 140,
    },
    '&:last-of-type': {
      minHeight: '85vh',
      paddingBottom: 200,
    },
    [theme.breakpoints.down('sm')]: {
      paddingLeft: 20,
      paddingRight: 20,
    },
  },
  sectionTall: {
    minHeight: '85vh',
  },
  sectionNoFade: {
    // Don't fade the "most valuable posts" section since it can be very tall
    '@supports (animation-timeline: view())': {
      animation: 'none',
      animationTimeline: 'none',
    },
  },
  summaryLinkWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  heartIcon: {
    marginLeft: 1,
    '& svg': {
      width: 28,
      height: 20
    }
  },
  lightbulbIcon: {
    width: 120,
  },
  chart: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    margin: '40px auto 0',
  },
  stats: {
    width: '100%',
    maxWidth: 400,
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    margin: '0 auto',
  },
  stat: {
    flex: 'none',
    width: 100
  },
  statLabel: {
    fontSize: 13,
    lineHeight: '17px',
    fontWeight: 500,
    marginTop: 8
  },
  calendar: {
    maxWidth: 600,
    display: 'inline-grid',
    gridTemplateColumns: "repeat(31, 6px)",
    gridTemplateRows: "repeat(12, 6px)",
    gap: '4px',
    margin: '40px auto 0',
  },
  calendarDot: {
    height: 6,
    width: 6,
    backgroundColor: theme.palette.wrapped.darkDot,
    borderRadius: '50%'
  },
  calendarDotActive: {
    backgroundColor: theme.palette.text.alwaysWhite,
  },
  topicsChart: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
    padding: '0 10px', // extra padding because the chart labels can overflow
    margin: '40px auto 0',
  },
  engagementChartMark: {
    position: 'absolute',
    bottom: -42,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    color: theme.palette.text.alwaysWhite,
  },
  engagementChartArrow: {
    transform: 'rotate(135deg)',
  },
  relativeTopicsChartMarkYou: {
    position: 'absolute',
    left: 130,
    top: -29,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    color: theme.palette.wrapped.highlightText
  },
  relativeTopicsChartMarkAvg: {
    position: 'absolute',
    left: 147,
    top: 35,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '4px',
    color: theme.palette.text.alwaysWhite,
  },
  relativeTopicsChartArrowAvg: {
    width: 22,
    transform: 'rotate(98deg)',
  },
  chartLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 500,
    margin: '0 auto 14px'
  },
  karmaFromPostsLabel: {
    color: theme.palette.wrapped.highlightText
  },
  karmaFromCommentsLabel: {
    color: theme.palette.wrapped.secondaryText
  },
  authors: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: 300,
    textAlign: 'left',
    margin: '30px auto 0',
  },
  author: {
    display: 'flex',
    gap: '16px',
    background: theme.palette.wrapped.panelBackground,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 400,
    borderRadius: theme.borderRadius.default,
    padding: '8px 16px'
  },
  authorName: {
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 700,
    margin: 0
  },
  authorReadCount: {
    margin: 0
  },
  messageAuthor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    width: '100%',
    maxWidth: 500,
    textAlign: 'left',
    margin: '50px auto 0',
  },
  topAuthorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 500,
    color: theme.palette.wrapped.tertiaryText,
  },
  newMessageForm: {
    background: theme.palette.wrapped.panelBackground,
    borderRadius: theme.borderRadius.default,
    padding: '0 16px 16px',
    '& .ck-placeholder': {
      '--ck-color-engine-placeholder-text': theme.palette.wrapped.tertiaryText,
    },
    '& .ContentStyles-commentBody': {
      color: theme.palette.text.alwaysWhite,
    },
    '& .EditorTypeSelect-select': {
      display: 'none'
    },
    '& .input-noEmail': {
      display: 'none'
    },
    '& .form-submit': {
      display: 'flex',
      justifyContent: 'flex-end'
    },
    '& button': {
      background: theme.palette.text.alwaysWhite,
      color: theme.palette.wrapped.black,
      '&:hover': {
        background: `color-mix(in oklab, ${theme.palette.text.alwaysWhite} 90%, ${theme.palette.text.alwaysBlack})`,
        color: theme.palette.wrapped.black,
      }
    },
  },
  topPost: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: 380,
    margin: '24px auto 0',
  },
  nextTopPosts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: 380,
    margin: '10px auto 0',
  },
  post: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    minHeight: 56,
    background: theme.palette.text.alwaysWhite,
    color: theme.palette.wrapped.black,
    fontSize: 14,
    lineHeight: 'normal',
    fontWeight: 600,
    textAlign: 'left',
    borderRadius: theme.borderRadius.default,
    padding: '12px',
    cursor: 'pointer',
    '&:hover': {
      opacity: 0.9
    }
  },
  postScore: {
    flex: 'none',
    width: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    color: theme.palette.wrapped.grey,
  },
  postVoteArrow: {
    color: theme.palette.wrapped.postScoreArrow,
    margin: "-6px 0 2px 0",
  },
  postTitleAndMeta: {
    flexGrow: 1
  },
  postTitle: {
    lineHeight: '19px',
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  postMetaRow: {
    display: 'flex'
  },
  postMeta: {
    color: theme.palette.wrapped.grey,
    fontSize: 12,
    fontWeight: 500,
    marginTop: 2
  },
  bookmarkIcon: {
    fontSize: 18
  },
  comment: {
    color: theme.palette.wrapped.black,
    background: theme.palette.text.alwaysWhite,
    textAlign: 'left',
    borderRadius: theme.borderRadius.default,
    padding: "8px 12px",
  },
  commentPostTitle: {
    fontSize: 12,
    lineHeight: '17px',
    color: theme.palette.wrapped.grey,
    marginBottom: 6,
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 2,
  },
  commentMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '3px 16px',
    color: theme.palette.wrapped.darkGrey,
    '& .EAReactsSection-button': {
      color: theme.palette.wrapped.darkGrey,
    }
  },
  commentAuthorAndDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 600
  },
  commentDate: {
    color: theme.palette.wrapped.grey,
  },
  commentScore: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  commentKarma: {
    display: 'flex',
    gap: '5px',
    fontWeight: 500,
  },
  commentVoteArrow: {
    color: theme.palette.wrapped.grey,
    transform: 'translateY(-2px)',
  },
  commentReacts: {
    display: 'flex'
  },
  commentLink: {
    flexGrow: 1,
    textAlign: 'right',
    paddingLeft: 10,
  },
  commentLinkIcon: {
    fontSize: 14,
    color: theme.palette.wrapped.grey,
    transform: 'translateY(1px)',
  },
  commentBody: {
    color: theme.palette.wrapped.black,
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 5,
  },
  backgroundReact: {
    position: 'absolute',
    color: theme.palette.primary.main,
  },
  reactsReceivedContents: {
    position: 'relative',
  },
  otherReacts: {
    width: '100%',
    maxWidth: 400,
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: '16px',
    margin: '30px auto 0',
  },
  recommendedPosts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    maxWidth: 380,
    margin: '40px auto 0',
    '& .RecommendationsList-noMoreMessage': {
      color: theme.palette.text.alwaysWhite,
    }
  },
  summary: {
    width: '100%',
    maxWidth: 400,
    margin: '22px auto 0',
  },
  summaryBoxRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
  },
  summaryBox: {
    width: '100%',
    background: theme.palette.wrapped.panelBackgroundDark,
    borderRadius: theme.borderRadius.default,
    padding: '10px 12px',
  },
  summaryLabel: {
    textAlign: 'left',
    fontSize: 13,
    lineHeight: 'normal',
    fontWeight: 500,
  },
  summaryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%',
    textAlign: 'left',
  },
  summaryListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    textWrap: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  summaryTopicIconPlaceholder: {
    width: 16,
    height: 16
  },
  mvpColLabels: {
    width: '100%',
    maxWidth: 500,
    display: 'flex',
    justifyContent: 'space-between',
  },
  mvpUpvotesLabel: {
    fontSize: 16,
    fontWeight: 600,
  },
  mvpHeartLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 13,
    fontWeight: 500,
    paddingRight: 20
  },
  mvpHeartIcon: {
    fontSize: 16
  },
  mvpList: {
    width: '100%',
    maxWidth: 500,
    textAlign: 'left',
    '& .LoadMore-root': {
      color: theme.palette.text.alwaysWhite,
    },
    '& .Loading-spinner': {
      margin: '10px 0 0'
    }
  },
  mvpPostItem: {
    marginBottom: 4,
    '& .EAPostsItem-expandedCommentsWrapper': {
      background: theme.palette.text.alwaysWhite,
      border: 'none',
      "&:hover": {
        background: theme.palette.text.alwaysWhite,
        border: 'none',
        opacity: 0.9
      },
    },
    '& .PostsTitle-root': {
      color: theme.palette.wrapped.black,
    },
    '& .PostsTitle-read': {
      color: theme.palette.wrapped.black,
    },
    '& .PostsItemIcons-icon': {
      color: theme.palette.wrapped.grey,
    },
    '& .PostsItemIcons-linkIcon': {
      color: theme.palette.wrapped.grey,
    },
    '& .EAKarmaDisplay-root': {
      color: theme.palette.wrapped.grey,
    },
    '& .EAKarmaDisplay-voteArrow': {
      color: theme.palette.wrapped.postScoreArrow,
    },
    '& .EAPostMeta-root': {
      color: theme.palette.wrapped.grey,
    },
    '& .PostsItem2MetaInfo-metaInfo': {
      color: theme.palette.wrapped.grey,
    },
  },
  heading2: {
    fontSize: 32,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.72px',
  },
  heading3: {
    fontSize: 28,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.56px',
    textDecorationLine: 'none',
    margin: 0
  },
  heading4: {
    fontSize: 24,
    lineHeight: 'normal',
    fontWeight: 700,
    letterSpacing: '-0.56px',
    margin: 0
  },
  heading5: {
    fontSize: 16,
    lineHeight: '22px',
    fontWeight: 600,
    margin: 0
  },
  textRow: {
    maxWidth: 500,
  },
  text: {
    fontSize: 14,
    lineHeight: '21px',
    fontWeight: 500,
    color: theme.palette.text.alwaysWhite,
  },
  highlight: {
    color: theme.palette.wrapped.highlightText,
  },
  link: {
    textDecoration: 'underline',
    textUnderlineOffset: '4px',
    '&:hover': {
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    }
  },
  balance: {
    textWrap: 'balance'
  },
  nowrap: {
    textWrap: 'nowrap'
  },
  m0: { margin: 0 },
  mt10: { marginTop: 10 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt26: { marginTop: 26 },
  mt30: { marginTop: 30 },
  mt40: { marginTop: 40 },
  mt60: { marginTop: 60 },
  mt70: { marginTop: 70 },
  mt100: { marginTop: 100 },
})

type ReceivedReact = {
  top: string,
  left: string,
  Component: React.ComponentType
}

const wrappedHighlightColor = requireCssVar("palette", "wrapped", "highlightText")
const wrappedSecondaryColor = requireCssVar("palette", "wrapped", "secondaryText")

// A sample of data to approximate the real graph
type EngagementDataPoint = {
  hours: number,
  count: number
}
const ENGAGEMENT_CHART_DATA: Record<WrappedYear, EngagementDataPoint[]> = {
  2022: [
    {hours: 0, count: 915},
    {hours: 1, count: 1687},
    {hours: 2, count: 770},
    {hours: 3, count: 467},
    {hours: 4, count: 346},
    {hours: 5, count: 258},
    {hours: 8, count: 142},
    {hours: 10, count: 115},
    {hours: 12, count: 92},
    {hours: 14, count: 72},
    {hours: 18, count: 42},
    {hours: 22, count: 37},
    {hours: 26, count: 34},
    {hours: 35, count: 22},
    {hours: 48, count: 7},
    {hours: 59, count: 6},
    {hours: 70, count: 1},
    {hours: 80, count: 4},
    {hours: 113, count: 1},
    {hours: 445, count: 1},
  ],
  2023: [
    {hours: 0, count: 878},
    {hours: 1, count: 1857},
    {hours: 2, count: 884},
    {hours: 3, count: 522},
    {hours: 4, count: 393},
    {hours: 5, count: 309},
    {hours: 8, count: 197},
    {hours: 10, count: 135},
    {hours: 12, count: 102},
    {hours: 14, count: 97},
    {hours: 18, count: 63},
    {hours: 22, count: 39},
    {hours: 26, count: 20},
    {hours: 35, count: 14},
    {hours: 48, count: 8},
    {hours: 59, count: 6},
    {hours: 70, count: 2},
    {hours: 80, count: 2},
    {hours: 113, count: 1},
    {hours: 525, count: 1},
  ],
  2024: [
    {hours: 0, count: 878},
  ],
}

/**
 * Formats the percentile as an integer > 0
 */
const formattedPercentile = (percentile: number) => (
  Math.ceil((1 - percentile) * 100) || 1
)

/**
 * Formats the karma change number as a string with a + or -
 */
const formattedKarmaChangeText = (karmaChange: number) => (
  `${karmaChange >= 0 ? '+' : ''}${karmaChange}`
)

/**
 * Adds tracking to the user profile link
 */
const getUserProfileLink = (slug: string, year: WrappedYear) => `${userGetProfileUrlFromSlug(slug)}?from=${year}_wrapped`

/**
 * A single post item, used in TopPostSection and RecommendationsSection
 */
const Post = ({post, classes}: {
  post: WrappedTopPost|PostsListWithVotesAndSequence,
  classes: ClassesType<typeof styles>
}) => {
  const authorExpandContainer = useRef(null);
  const postLink = postGetPageUrl(post)
  const {onClick} = useClickableCell({href: postLink});

  const { PostsItemTooltipWrapper, TruncatedAuthorsList, BookmarkButton } = Components
  // If this is the user's own post, we use the simple version of this component with less info.
  // If this is a post recommended to the user, we show things like the post author list.
  const isRecommendedPost = 'user' in post
  
  const titleNode = <InteractionWrapper>
    <Link to={postLink}>{post.title}</Link>
  </InteractionWrapper>
  const readTimeText = (!isRecommendedPost || isPostWithForeignId(post)) ? '' : `, ${post.readTimeMinutes ?? 1} min read`
  
  return <article className={classes.post} ref={authorExpandContainer} onClick={onClick}>
    <div className={classes.postScore}>
      <div className={classes.postVoteArrow}>
        <SoftUpArrowIcon />
      </div>
      {post.baseScore}
    </div>
    <div className={classes.postTitleAndMeta}>
      <div className={classes.postTitle}>
        {isRecommendedPost ? <PostsItemTooltipWrapper post={post}>
          {titleNode}
        </PostsItemTooltipWrapper> : titleNode}
      </div>
      {isRecommendedPost && <div className={classes.postMetaRow}>
        <InteractionWrapper>
          <TruncatedAuthorsList post={post} expandContainer={authorExpandContainer} className={classes.postMeta} />
        </InteractionWrapper>
        <span className={classes.postMeta}>
          {readTimeText}
        </span>
      </div>}
    </div>
    {isRecommendedPost && <InteractionWrapper>
      <BookmarkButton post={post} className={classes.bookmarkIcon} />
    </InteractionWrapper>}
  </article>
}

/**
 * A single comment item, used in TopCommentSection and TopShortformSection
 */
const Comment = ({comment, classes}: {
  comment: WrappedTopComment|WrappedTopShortform,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  
  const commentLinkProps = {
    comment: {
      ...comment,
      tagCommentType: 'DISCUSSION' as TagCommentType
    },
    post: {
      _id: comment.postId,
      slug: 'postSlug' in comment ? comment.postSlug : ''
    }
  };
  const CommentLinkWrapper = useCommentLink(commentLinkProps);
  
  const { LWTooltip, EAReactsSection, ContentStyles, ForumIcon } = Components
  
  return <article className={classes.comment}>
    {'postTitle' in comment && <div className={classes.commentPostTitle}>
      <Link to={postGetPageUrl({_id: comment.postId, slug: comment.postSlug})}>
        {comment.postTitle}
      </Link>
    </div>}
    <div className={classes.commentMeta}>
      <div className={classes.commentAuthorAndDate}>
        <div className={classes.commentAuthor}>{currentUser?.displayName}</div>
        <div className={classes.commentDate}>
          <LWTooltip
            placement="right"
            title={<ExpandedDate date={comment.postedAt} />}
          >
            <CommentLinkWrapper>
              {moment(new Date(comment.postedAt)).fromNow()}
            </CommentLinkWrapper>
          </LWTooltip>
        </div>
      </div>
      <div className={classes.commentScore}>
        <div className={classes.commentKarma}>
          <div className={classes.commentVoteArrow}>
            <SoftUpArrowIcon />
          </div>
          {comment.baseScore}
        </div>
        <div className={classes.commentReacts}>
          <EAReactsSection document={comment} voteProps={{document: comment}} viewOnly />
        </div>
        <div className={classes.commentLink}>
          <CommentLinkWrapper>
            <ForumIcon icon="Link" className={classes.commentLinkIcon} />
          </CommentLinkWrapper>
        </div>
      </div>
    </div>
    <ContentStyles contentType="comment">
      <div className={classes.commentBody}>
        {htmlToTextDefault(comment.contents.html)}
      </div>
    </ContentStyles>
  </article>
}

/**
 * The x-axis label for the karma change chart, used in KarmaChangeSection
 */
const KarmaChangeXAxis = () => {
  return <>
    <text y="100%" fontSize={12} fill="#FFF" textAnchor="start">Jan</text>
    <text x="100%" y="100%" fontSize={12} fill="#FFF" textAnchor="end">Dec</text>
  </>
}

/**
 * Section that displays the user's engagement relative to other users
 */
const EngagementPercentileSection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  // This is the x-axis position for the "you" arrow mark on the engagement chart.
  // The highest value on the x-axis is ~530 hours.
  // We multiply by 97.5 instead of 100 to account for the chart being less than the total width.
  // We shift everything by 8px to account for the space that the y-axis takes up.
  const engagementHours = (data.totalSeconds / 3600)
  const markPosition = `calc(${97.5 * engagementHours / 530}% + 8px)`
  const xMax = year === 2022 ? 450 : 530

  return <AnalyticsContext pageSectionContext="engagementPercentile">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        You’re a top <span className={classes.highlight}>{formattedPercentile(data.engagementPercentile)}%</span> reader of the EA Forum
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt16)}>You read {data.postsReadCount} posts this year</p>
      <div className={classes.chart}>
        <aside className={classes.engagementChartMark} style={{left: markPosition}}>
          <div className={classes.engagementChartArrow}>
            {drawnArrow}
          </div>
          you
        </aside>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart width={350} height={200} data={ENGAGEMENT_CHART_DATA[year]}>
            <YAxis dataKey="count" tick={false} axisLine={{strokeWidth: 2, stroke: '#FFF'}} width={2} />
            <XAxis dataKey="hours" tick={false} axisLine={{strokeWidth: 2, stroke: '#FFF'}} height={2} scale="linear" type="number" domain={[0, xMax]} />
            <Line dataKey="count" dot={false} stroke={wrappedHighlightColor} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the user's hours of engagement
 */
const EngagementHoursSection = ({engagementHours, year, classes}: {
  engagementHours: number,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  return <AnalyticsContext pageSectionContext="engagementHours">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        You spent <span className={classes.highlight}>{engagementHours.toFixed(1)}</span> hours on the EA Forum in {year}
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt70)}>Which is about the same as...</p>
      <div className={classNames(classes.stats, classes.mt30)}>
        <article className={classes.stat}>
          <div className={classes.heading3}>{(engagementHours / 3.5).toFixed(1)}</div>
          <div className={classes.statLabel}>episodes of the 80,000 hours podcast</div>
        </article>
        <article className={classes.stat}>
          <div className={classes.heading3}>{(engagementHours / 25).toFixed(1)}</div>
          <div className={classes.statLabel}>EAG(x) conferences</div>
        </article>
        <article className={classes.stat}>
          <div className={classes.heading3}>{(engagementHours / 4320).toFixed(3)}</div>
          <div className={classes.statLabel}>Llama 2s trained</div>
        </article>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the calendar of days that the user visited the forum,
 * visualized as 12 rows of dots, with the visited days' dots being white
 */
const DaysVisitedSection = ({daysVisited, year, classes}: {
  daysVisited: string[],
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  return <AnalyticsContext pageSectionContext="daysVisited">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        You visited the EA Forum on <span className={classes.highlight}>{daysVisited.length}</span> days in {year}
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt16)}>
        (You may have visited more times while logged out)
      </p>
      <div className={classes.calendar}>
        {range(0, 12).map((month: number) => {
          const daysInMonth = moment(`${year}-${month+1}`, 'YYYY-M').daysInMonth()
          return <Fragment key={`month-${month}`}>
            {range(0, daysInMonth).map(day => {
              const date = moment(`${year}-${month+1}-${day+1}`, 'YYYY-M-D')
              return <div
                key={`month-${month}-day-${day}`}
                className={classNames(classes.calendarDot, {
                  [classes.calendarDotActive]: daysVisited.some(d => moment(d).isSame(date))
                })}
              ></div>
            })}
            {range(daysInMonth, 31).map(day => {
              return <div key={`month-${month}-day-${day}`}></div>
            })}
          </Fragment>
        })}
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays a list of the user's most-read topics
 */
const MostReadTopicsSection = ({mostReadTopics, classes}: {
  mostReadTopics: WrappedMostReadTopic[],
  classes: ClassesType<typeof styles>
}) => {
  if (!mostReadTopics.length) return null;
  
  // The top bar is highlighted yellow, the rest are white
  const topics = mostReadTopics.map((topic, i) => {
    return {
      ...topic,
      fill: i === 0 ? wrappedHighlightColor : '#FFF'
    }
  })

  return <AnalyticsContext pageSectionContext="mostReadTopics">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        When you were reading a post, it was most often about <span className={classes.highlight}>{topics[0].name}</span>
      </h1>
      <div className={classes.topicsChart}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart layout="vertical" width={350} height={200} data={topics} barCategoryGap={'20%'} {...{overflow: 'visible'}}>
            <YAxis
              dataKey="shortName"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{fill: '#FFF'}}
              tickMargin={10}
            />
            <XAxis dataKey="count" type="number" hide />
            <Bar dataKey="count" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays a list of the core topics that the user has read more relative to the avg
 */
const RelativeMostReadTopicsSection = ({relativeMostReadCoreTopics, classes}: {
  relativeMostReadCoreTopics: WrappedRelativeMostReadCoreTopic[],
  classes: ClassesType<typeof styles>
}) => {
  const relativeMostReadTopics = relativeMostReadCoreTopics.map(topic => {
    return {
      ...topic,
      tagName: topic.tagShortName ?? topic.tagName,
      overallReadCount: topic.userReadCount / topic.readLikelihoodRatio
    }
  }).slice(0, 4)
  // We shrink the chart such that the bars are always the same thickness,
  // so that the mark arrows point to the proper places.
  const relativeTopicsChartHeight = 200 * (relativeMostReadTopics.length / 4)
  
  if (!relativeMostReadTopics.length) return null;

  return <AnalyticsContext pageSectionContext="relativeMostReadTopics">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        You read more <span className={classes.highlight}>{relativeMostReadTopics[0].tagName}</span> posts than average
      </h1>
      <div className={classes.topicsChart}>
        <aside className={classes.relativeTopicsChartMarkYou}>
          you
          {drawnArrow}
        </aside>
        <aside className={classes.relativeTopicsChartMarkAvg}>
          <div className={classes.relativeTopicsChartArrowAvg}>
            {drawnArrow}
          </div>
          average
        </aside>
        <ResponsiveContainer width="100%" height={relativeTopicsChartHeight}>
          <BarChart
            layout="vertical"
            width={350}
            height={relativeTopicsChartHeight}
            data={relativeMostReadTopics}
            barCategoryGap={'20%'}
            barGap={0}
            {...{overflow: 'visible'}}
          >
            <YAxis
              dataKey="tagName"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              tick={{fill: '#FFF'}}
              tickMargin={10}
            />
            <XAxis dataKey="userReadCount" type="number" hide />
            <Bar dataKey="userReadCount" fill={wrappedHighlightColor} />
            <Bar dataKey="overallReadCount" fill="#FFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays a list of the user's most-read authors
 */
const MostReadAuthorsSection = ({authors, year, classes}: {
  authors: WrappedMostReadAuthor[],
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  if (!authors.length) return null;

  return <AnalyticsContext pageSectionContext="mostReadAuthors">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Your most-read author was <span className={classes.highlight}>{authors[0].displayName}</span>
      </h1>
      <div className={classes.authors}>
        {authors.map(author => {
          return <article key={author.slug} className={classes.author}>
            <Components.UsersProfileImage size={40} user={author} />
            <div>
              <h2 className={classes.authorName}>
                <Link to={getUserProfileLink(author.slug, year)}>
                  {author.displayName}
                </Link>
              </h2>
              <p className={classes.authorReadCount}>
                {author.count} post{author.count === 1 ? '' : 's'} read
              </p>
            </div>
          </article>
        })}
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that prompts the user to DM the author of whom they are in the highest percentile of readership
 */
const ThankAuthorSection = ({authors, year, classes}: {
  authors: WrappedMostReadAuthor[],
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking();
  
  // Find the author for which the current user is in the highest percentile
  const topAuthorByEngagementPercentile = [...authors].sort((a, b) => b.engagementPercentile - a.engagementPercentile)[0]
  const topAuthorPercentByEngagementPercentile = (topAuthorByEngagementPercentile && Math.ceil(100 * (1 - topAuthorByEngagementPercentile.engagementPercentile))) || 1
  const showThankAuthor = currentUser && topAuthorByEngagementPercentile && topAuthorPercentByEngagementPercentile <= 10 && userCanStartConversations(currentUser)
  
  const { conversation, initiateConversation } = useInitiateConversation()
  useEffect(() => {
    if (showThankAuthor) initiateConversation([topAuthorByEngagementPercentile._id])
  }, [showThankAuthor, initiateConversation, topAuthorByEngagementPercentile])
  if (!showThankAuthor || !conversation) return null
  
  return <AnalyticsContext pageSectionContext="thankAuthor">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        You’re in the top <span className={classes.highlight}>{topAuthorPercentByEngagementPercentile}%</span> of {topAuthorByEngagementPercentile.displayName}’s readers
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt20)}>Want to say thanks? Send a DM below</p>
      <div className={classes.messageAuthor}>
        <div className={classes.topAuthorInfo}>
          <div>To:</div>
          <div><Components.UsersProfileImage size={24} user={topAuthorByEngagementPercentile} /></div>
          <div className={classes.text}>
            <Link to={getUserProfileLink(topAuthorByEngagementPercentile.slug, year)}>
              {topAuthorByEngagementPercentile.displayName}
            </Link>
          </div>
        </div>
        <div className={classes.newMessageForm}>
          <Components.MessagesNewForm
            conversationId={conversation._id}
            successEvent={() => {
              captureEvent("messageSent", {
                conversationId: conversation._id,
                sender: currentUser._id,
                participantIds: conversation.participantIds,
                messageCount: (conversation.messageCount || 0) + 1,
                from: `${year}_wrapped_thank_author`,
              });
            }}
          />
        </div>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the user's highest-karma post plus other data on their posts
 */
const TopPostSection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  if (!data.topPosts?.length) return null;
  // Only show this section if their top post got 10 karma
  const topPost = data.topPosts[0]
  if (topPost.baseScore < 10) return null;
  
  const percentile = formattedPercentile(data.authorPercentile)
  
  return <AnalyticsContext pageSectionContext="topPost">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Your highest-karma <span className={classes.highlight}>post</span> in {year}:
      </h1>
      <div className={classes.topPost}>
        <Post post={data.topPosts[0]} classes={classes} />
      </div>
      {data.topPosts.length > 1 && <>
        <p className={classNames(classes.textRow, classes.text, classes.mt60)}>
          Other posts you wrote this year...
        </p>
        <div className={classes.nextTopPosts}>
          {data.topPosts.slice(1).map(post => {
            return <Post key={post._id} post={post} classes={classes} />
          })}
        </div>
      </>}
      <p className={classNames(classes.textRow, classes.text, classes.mt40)}>
        You wrote {data.postCount} post{data.postCount === 1 ? '' : 's'} in total this year.
        {(percentile < 100) && ` This means you're in the top ${percentile}% of post authors.`}
      </p>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the user's highest-karma comment plus other data on their comments
 */
const TopCommentSection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  if (!data.topComment) return null;
  // Only show this section if their top comment has >0 karma
  if (data.topComment.baseScore < 1) return null;
  
  const percentile = formattedPercentile(data.commenterPercentile)
  
  return <AnalyticsContext pageSectionContext="topComment">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Your highest-karma <span className={classes.highlight}>comment</span> in {year}:
      </h1>
      <div className={classes.topPost}>
        <Comment comment={data.topComment} classes={classes} />
      </div>
      <p className={classNames(classes.textRow, classes.text, classes.mt30)}>
        You wrote {data.commentCount} comment{data.commentCount === 1 ? '' : 's'} in total this year.
        {(percentile < 100) && ` This means you're in the top ${percentile}% of commenters.`}
      </p>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the user's highest-karma quick take (shortform) plus other data on their quick takes
 */
const TopQuickTakeSection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  if (!data.topShortform) return null;
  // Only show this section if their top quick take has >0 karma
  if (data.topShortform.baseScore < 1) return null;
  
  const percentile = formattedPercentile(data.shortformPercentile)

  return <AnalyticsContext pageSectionContext="topQuickTake">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Your highest-karma <span className={classes.highlight}>quick take</span> in {year}:
      </h1>
      <div className={classes.topPost}>
        <Comment comment={data.topShortform} classes={classes} />
      </div>
      <p className={classNames(classes.textRow, classes.text, classes.mt30)}>
        You wrote {data.shortformCount} quick take{data.shortformCount === 1 ? '' : 's'} in total this year.
        {(percentile < 100) && ` This means you're in the top ${percentile}% of quick take authors.`}
      </p>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays the user's overall karma change and accompanying chart
 */
const KarmaChangeSection = ({data, classes}: {
  data: WrappedDataByYear,
  classes: ClassesType<typeof styles>
}) => {
  // If the user hasn't written anything and their karma change is 0, hide the karma change section
  const hasWrittenContent = !!data.topPosts?.length || data.topComment || data.topShortform
  if (data.karmaChange === undefined || (!hasWrittenContent && data.karmaChange === 0)) return null;
  
  return <AnalyticsContext pageSectionContext="karmaChange">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Your overall karma change this year was <span className={classes.highlight}>{formattedKarmaChangeText(data.karmaChange)}</span>
      </h1>
      <div className={classes.chart}>
        <div className={classes.chartLabels}>
          <div className={classes.karmaFromPostsLabel}>Karma from posts</div>
          <div className={classes.karmaFromCommentsLabel}>Karma from comments</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart width={350} height={200} data={data.combinedKarmaVals}>
            <YAxis tick={false} axisLine={{strokeWidth: 2, stroke: '#FFF'}} width={2} />
            <XAxis dataKey="date" tick={false} axisLine={{strokeWidth: 3, stroke: '#FFF'}} height={16} label={<KarmaChangeXAxis />} />
            <Area dataKey="commentKarma" stackId="1" stroke={wrappedSecondaryColor} fill={wrappedSecondaryColor} fillOpacity={1} />
            <Area dataKey="postKarma" stackId="1" stroke={wrappedHighlightColor} fill={wrappedHighlightColor} fillOpacity={1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays data on the reacts that the user received
 */
const ReactsReceivedSection = ({receivedReacts, classes}: {
  receivedReacts: WrappedReceivedReact[],
  classes: ClassesType<typeof styles>
}) => {
  // Randomly display all the reacts the user received in the background
  const placeBackgroundReacts = (reacts: WrappedReceivedReact[]) => {
    if (!isClient) return []
    return reacts?.reduce((prev: ReceivedReact[], next) => {
      const Component = eaEmojiPalette.find(emoji => emoji.label === next.name)?.Component
      if (Component) {
        // only go to 96% to prevent causing a horizontal scroll
        range(0, next.count).forEach(_ => prev.push({
          top: `${Math.random() * 96}%`,
          left: `${Math.random() * 96}%`,
          Component
        }))
      }
      return prev
    }, [])
  }

  const [allReactsReceived, setAllReactsReceived] = useState<ReceivedReact[]>([])
  useEffect(() => {
    setAllReactsReceived(placeBackgroundReacts(receivedReacts))
  }, [receivedReacts])
  
  const totalReactsReceived = receivedReacts.reduce((prev, next) => prev + next.count, 0)
  if (totalReactsReceived <= 5) return null
  
  return <AnalyticsContext pageSectionContext="reactsReceived">
    <section className={classNames(classes.section, classes.sectionTall)}>
      {allReactsReceived?.map((react, i) => {
        return <div
          key={i}
          className={classes.backgroundReact}
          style={{top: react.top, left: react.left}}
        >
          <react.Component />
        </div>
      })}
      <div className={classes.reactsReceivedContents}>
        <h1 className={classes.heading3}>
          Others gave you{" "}
          <span className={classes.highlight}>
            {receivedReacts[0].count} {receivedReacts[0].name}
          </span>{" "}
          reacts{receivedReacts.length > 1 ? '...' : ''}
        </h1>
        {receivedReacts.length > 1 && <div className={classes.otherReacts}>
          <p className={classes.heading5}>... and {totalReactsReceived} reacts in total:</p>
          <div className={classNames(classes.stats, classes.mt26)}>
            {receivedReacts.slice(1).map(react => {
              return <article key={react.name} className={classes.stat}>
                <div className={classes.heading3}>{react.count}</div>
                <div className={classes.statLabel}>{react.name}</div>
              </article>
            })}
          </div>
        </div>}
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that thanks the user
 */
const ThankYouSection = ({year, classes}: {
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  return <AnalyticsContext pageSectionContext="thankYou">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Thank you! <span className={classes.heartIcon}><HeartReactionIcon /></span>
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.balance, classes.mt20)}>
        Thanks for joining us on the EA Forum and helping us think about how to improve the world.
      </p>
      <div className={classNames(classes.lightbulbIcon, classes.mt30)}>
        {lightbulbIcon}
      </div>
      <p className={classNames(classes.summaryLinkWrapper, classes.text, classes.mt70)}>
        Here’s your {year} all in one page
        <Components.ForumIcon icon="NarrowArrowDown" />
      </p>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays a screenshottable summary of the user's Wrapped data
 */
const SummarySection = ({data, year, classes}: {
  data: WrappedDataByYear,
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()

  const { UsersProfileImage, CoreTagIcon } = Components

  return <AnalyticsContext pageSectionContext="summary">
    <section className={classes.section}>
      <p className={classNames(classes.text, classes.m0)}>Effective Altruism Forum</p>
      <h1 className={classNames(classes.heading2, classes.mt10)}>
        <span className={classes.nowrap}>{currentUser?.displayName}’s</span>{" "}
        <span className={classes.nowrap}>{year} Wrapped</span>
      </h1>
      <div className={classes.summary}>
        <div className={classes.summaryBoxRow}>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{formattedPercentile(data.engagementPercentile)}%</div>
              <div className={classes.statLabel}>Top reader</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{(data.totalSeconds / 3600).toFixed(1)}</div>
              <div className={classes.statLabel}>Hours spent</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.daysVisited.length}</div>
              <div className={classes.statLabel}>Days visited</div>
            </article>
          </div>
        </div>
        
        {!!data.mostReadAuthors.length && <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
          <div className={classes.summaryBox}>
            <div className={classes.summaryLabel}>Most-read authors</div>
            <div className={classNames(classes.summaryList, classes.mt12)}>
              {data.mostReadAuthors.map(author => {
                return <div key={author.slug} className={classes.summaryListItem}>
                  <UsersProfileImage size={20} user={author} />
                  <Link to={getUserProfileLink(author.slug, year)}>
                    {author.displayName}
                  </Link>
                </div>
              })}
            </div>
          </div>
        </div>}
        
        {!!data.mostReadTopics.length && <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
          <div className={classes.summaryBox}>
            <div className={classes.summaryLabel}>Most-read topics</div>
            <div className={classNames(classes.summaryList, classes.mt12)}>
              {data.mostReadTopics.map(topic => {
                return <div key={topic.slug} className={classes.summaryListItem}>
                  <CoreTagIcon tag={topic} fallbackNode={<div className={classes.summaryTopicIconPlaceholder}></div>} />
                  <Link to={tagGetUrl({slug: topic.slug})}>
                    {topic.name}
                  </Link>
                </div>
              })}
            </div>
          </div>
        </div>}
        
        <div className={classNames(classes.summaryBoxRow, classes.mt10)}>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{formattedKarmaChangeText(data.karmaChange)}</div>
              <div className={classes.statLabel}>Karma</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.postCount}</div>
              <div className={classes.statLabel}>Post{data.postCount === 1 ? '' : 's'}</div>
            </article>
          </div>
          <div className={classes.summaryBox}>
            <article>
              <div className={classes.heading4}>{data.commentCount}</div>
              <div className={classes.statLabel}>Comment{data.commentCount === 1 ? '' : 's'}</div>
            </article>
          </div>
        </div>
      </div>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays some recommended posts to the user
 */
const RecommendationsSection = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  return <AnalyticsContext pageSectionContext="recommendations">
    <section className={classes.section}>
      <h1 className={classes.heading3}>
        Posts you missed that we think you’ll enjoy
      </h1>
      <DeferRender ssr={false}>
        <Components.RecommendationsList
          algorithm={{strategy: {name: 'bestOf', postId: '2023_wrapped'}, count: 5, disableFallbacks: true}}
          ListItem={
            (props: {
              post: PostsListWithVotesAndSequence,
              translucentBackground?: boolean,
            }) => (
              <Post post={props.post} classes={classes} />
            )
          }
          className={classes.recommendedPosts}
        />
      </DeferRender>
    </section>
  </AnalyticsContext>
}

/**
 * Section that displays all the user's upvoted posts and lets them mark which were "most valuable"
 */
const MostValuablePostsSection = ({year, classes}: {
  year: WrappedYear,
  classes: ClassesType<typeof styles>
}) => {
  const { ForumIcon, PostsByVoteWrapper } = Components
  
  return <AnalyticsContext pageSectionContext="mostValuablePosts">
    <section className={classNames(classes.section, classes.sectionNoFade)}>
      <h1 className={classes.heading3}>
        Which posts from {year} were most valuable for you?
      </h1>
      <p className={classNames(classes.textRow, classes.text, classes.mt16)}>
        These are your upvotes from {year}. Your choice of the most valuable posts will be really useful
        for helping us decide what to feature on the Forum. (We’ll only look at anonymized data.)
      </p>
      <div className={classNames(classes.mvpColLabels, classes.mt30)}>
        <div className={classes.mvpUpvotesLabel}>Your upvotes</div>
        <div className={classes.mvpHeartLabel}>
          Most valuable
          <ForumIcon icon="HeartOutline" className={classes.mvpHeartIcon} />
        </div>
      </div>
      <DeferRender ssr={false}>
        <div className={classNames(classes.mvpList, classes.mt10)}>
          <PostsByVoteWrapper voteType="bigUpvote" year={year} postItemClassName={classes.mvpPostItem} showMostValuableCheckbox hideEmptyStateText />
          <PostsByVoteWrapper voteType="smallUpvote" year={year} limit={10} postItemClassName={classes.mvpPostItem} showMostValuableCheckbox hideEmptyStateText />
        </div>
      </DeferRender>
    </section>
  </AnalyticsContext>
}

const EAForumWrappedPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const {params} = useLocation();
  const currentUser = useCurrentUser();

  const rawYear = parseInt(params.year);
  const year = isWrappedYear(rawYear) ? rawYear : 2024;

  const {data} = useForumWrapped({
    userId: currentUser?._id,
    year,
  });

  const isLoggedOut = !currentUser;
  const userCreatedAt = moment(currentUser?.createdAt);
  const endOfYear = moment(`${year}-12-31`, "YYYY-MM-DD");
  const isTooYoung = userCreatedAt.isAfter(endOfYear, "date");
  const hasWrapped = !isLoggedOut && !isTooYoung;

  const {HeadTags, WrappedWelcomeSection} = Components;
  return (
    <AnalyticsContext pageContext="eaYearWrapped" reviewYear={String(year)}>
      <main className={classes.root}>
        <HeadTags
          title={`EA Forum Wrapped ${year}`}
          image={makeCloudinaryImageUrl("2023_wrapped_wide", socialImageProps)}
        />
        <WrappedWelcomeSection year={year} isTooYoung={isTooYoung} />
        {hasWrapped && data &&
          <>
            <EngagementPercentileSection data={data} year={year} classes={classes} />
            <EngagementHoursSection engagementHours={(data.totalSeconds / 3600)} year={year} classes={classes} />
            <DaysVisitedSection daysVisited={data.daysVisited} year={year} classes={classes} />
            <MostReadTopicsSection mostReadTopics={data.mostReadTopics} classes={classes} />
            <RelativeMostReadTopicsSection relativeMostReadCoreTopics={data.relativeMostReadCoreTopics} classes={classes} />
            <MostReadAuthorsSection authors={data.mostReadAuthors} year={year} classes={classes} />
            <ThankAuthorSection authors={data.mostReadAuthors} year={year} classes={classes} />
            <TopPostSection data={data} year={year} classes={classes} />
            <TopCommentSection data={data} year={year} classes={classes} />
            <TopQuickTakeSection data={data} year={year} classes={classes} />
            <KarmaChangeSection data={data} classes={classes} />
            <ReactsReceivedSection receivedReacts={data.mostReceivedReacts} classes={classes} />
            <ThankYouSection year={year} classes={classes} />
            <SummarySection data={data} year={year} classes={classes} />
            <RecommendationsSection classes={classes} />
            <MostValuablePostsSection year={year} classes={classes} />
          </>
        }
      </main>
    </AnalyticsContext>
  )
}

const EAForumWrappedPageComponent = registerComponent('EAForumWrappedPage', EAForumWrappedPage, {styles})

declare global {
  interface ComponentTypes {
    EAForumWrappedPage: typeof EAForumWrappedPageComponent
  }
}
