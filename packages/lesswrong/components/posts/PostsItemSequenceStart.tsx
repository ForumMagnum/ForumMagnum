import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl, postGetLastCommentedAt, postGetLastCommentPromotedAt, postGetCommentCount } from "../../lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import CloseIcon from '@material-ui/icons/Close';
import { useCurrentUser } from "../common/withUser";
import classNames from 'classnames';
import { useRecordPostView } from '../common/withRecordPostView';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection'
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { getReviewPhase, postEligibleForReview, postIsVoteable, REVIEW_YEAR } from '../../lib/reviewUtils';
export const MENU_WIDTH = 18
export const KARMA_WIDTH = 42

export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    },
    '&:hover $actions': {
      opacity: .2,
    }
  },
  background: {
    width: "100%",
    background: theme.palette.panelBackground.default,
  },
  translucentBackground: {
    width: "100%",
    background: theme.palette.panelBackground.translucent,
    backdropFilter: "blur(1px)"
  },
  postsItem: {
    display: "flex",
    position: "relative",
    paddingTop: 10,
    paddingBottom: 10,
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
    flexGrow: 1,
    flexShrink: 1,
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
      paddingRight: theme.spacing.unit
    },
    '&:hover': {
      opacity: 1,
    }
  },
  author: {
    justifyContent: "flex",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis", // I'm not sure this line worked properly?
    marginRight: theme.spacing.unit*1.5,
    zIndex: theme.zIndexes.postItemAuthor,
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
  }
})

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";

const cloudinaryCloudName = cloudinaryCloudNameSetting.get()

const isSticky = (post: PostsList, terms: PostsViewTerms) => {
  if (post && terms && terms.forum) {
    return (
      post.sticky ||
      (terms.af && post.afSticky) ||
      (terms.meta && post.metaSticky)
    )
  }
}

const PostsItemSequenceStart = ({
  // post: The post displayed.
  post,
  // tagRel: (Optional) The relationship between this post and a tag. If
  // provided, UI will be shown with the score and voting on this post's
  // relevance to that tag.
  tagRel=null,
  // defaultToShowComments: (bool) If set, comments will be expanded by default.
  defaultToShowComments=false,
  // sequenceId, chapter: If set, these will be used for making a nicer URL.
  sequenceId, chapter,
  // index: If this is part of a list of PostsItems, its index (starting from
  // zero) into that list. Used for special casing some styling at start of
  // the list.
  index,
  // terms: If this is part of a list generated from a query, the terms of that
  // query. Used for figuring out which sticky icons to apply, if any.
  terms,
  sequence,
  // dismissRecommendation: If this is a Resume Reading suggestion, a callback
  // to dismiss it.
  dismissRecommendation,
  showBottomBorder=true,
  showQuestionTag=true,
  showDraftTag=true,
  showIcons=true,
  showPostedAt=true,
  defaultToShowUnreadComments=false,
  // dense: (bool) Slightly reduce margins to make this denser. Used on the
  // All Posts page.
  dense=false,
  // bookmark: (bool) Whether this is a bookmark. Adds a clickable bookmark
  // icon.
  bookmark=false,
  // showNominationCount: (bool) whether this should display it's number of Review nominations
  showNominationCount=false,
  showReviewCount=false,
  hideAuthor=false,
  classes,
  curatedIconLeft=false,
  translucentBackground=false,
  forceSticky=false
}: {
  post: PostsList,
  tagRel?: WithVoteTagRel|null,
  defaultToShowComments?: boolean,
  sequenceId?: string,
  chapter?: any,
  index?: number,
  terms?: any,
  sequence: SequencesPageFragment,
  dismissRecommendation?: any,
  showBottomBorder?: boolean,
  showQuestionTag?: boolean,
  showDraftTag?: boolean,
  showIcons?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  dense?: boolean,
  bookmark?: boolean,
  showNominationCount?: boolean,
  showReviewCount?: boolean,
  hideAuthor?: boolean,
  classes: ClassesType,
  curatedIconLeft?: boolean,
  translucentBackground?: boolean,
  forceSticky?: boolean
}) => {
  const { isRead, recordPostView } = useRecordPostView(post);

  const { PostsItemComments, PostsItemKarma, PostsTitle, PostsUserAndCoauthors, LWTooltip, 
    PostsPageActions, PostsItemIcons, PostsItem2MetaInfo, PostsItemTooltipWrapper,
    BookmarkButton, PostsItemDate, PostsItemNewCommentsWrapper, AnalyticsTracker,
    AddToCalendarButton, PostsItemReviewVote, ReviewPostButton } = (Components as ComponentTypes)

  const postLink = postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);

  return (
      <AnalyticsContext pageElementContext="postItem" postId={post._id}>
        <div className={classNames(
          classes.root,
          {
            [classes.background]: !translucentBackground,
            [classes.translucentBackground]: translucentBackground,
            [classes.bottomBorder]: showBottomBorder,
            [classes.isRead]: isRead
          })}
        >
          <PostsItemTooltipWrapper
            post={post}
            className={classNames(
              classes.postsItem,
              classes.withGrayHover, {
                [classes.dense]: dense,
                [classes.withRelevanceVoting]: !!tagRel
              }
            )}
          >
            <span className={classNames(classes.title)}>
              <AnalyticsTracker
                  eventType={"postItem"}
                  captureOnMount={(eventData) => eventData.capturePostItemOnMount}
                  captureOnClick={false}
              >
                <PostsTitle
                  postLink={postLink}
                  post={post}
                  read={isRead}
                  sticky={isSticky(post, terms) || forceSticky}
                  showQuestionTag={showQuestionTag}
                  showDraftTag={showDraftTag}
                  curatedIconLeft={curatedIconLeft}
                />
              </AnalyticsTracker>
            </span>

            { !post.isEvent && !hideAuthor && <PostsItem2MetaInfo className={classes.author}>
              <PostsUserAndCoauthors post={post} abbreviateIfLong={true} />
            </PostsItem2MetaInfo>}

            <div className={classes.mobileSecondRowSpacer}/>

            <div className={classes.sequenceImage}>
              <img className={classes.sequenceImageImg}
                src={`https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/c_fill,dpr_2.0,g_custom,h_96,q_auto,w_292/v1/${
                  sequence.gridImageId
                }`}
              />
            </div>
          </PostsItemTooltipWrapper>

        </div>
      </AnalyticsContext>
  )
};

const PostsItemSequenceStartComponent = registerComponent('PostsItemSequenceStart', PostsItemSequenceStart, {
  styles,
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsItemSequenceStart: typeof PostsItemSequenceStartComponent
  }
}
