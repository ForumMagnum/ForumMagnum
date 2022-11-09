import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { postGetPageUrl, postGetLastCommentedAt, postGetLastCommentPromotedAt, postGetCommentCount, postCanDelete } from "../../lib/collections/posts/helpers";
import { sequenceGetPageUrl } from "../../lib/collections/sequences/helpers";
import { collectionGetPageUrl } from "../../lib/collections/collections/helpers";
import withErrorBoundary from '../common/withErrorBoundary';
import CloseIcon from '@material-ui/icons/Close';
import ArchiveIcon from '@material-ui/icons/Archive';
import { useCurrentUser } from "../common/withUser";
import classNames from 'classnames';
import { useRecordPostView } from '../common/withRecordPostView';
import { NEW_COMMENT_MARGIN_BOTTOM } from '../comments/CommentsListSection'
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { cloudinaryCloudNameSetting } from '../../lib/publicSettings';
import { getReviewPhase, postEligibleForReview, postIsVoteable, REVIEW_YEAR } from '../../lib/reviewUtils';
import qs from "qs";
import { PopperPlacementType } from '@material-ui/core/Popper';
export const MENU_WIDTH = 18
export const KARMA_WIDTH = 42

export const styles = (theme: ThemeType): JssStyles => ({
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },
  root: {
    position: "relative",
    [theme.breakpoints.down('xs')]: {
      width: "100%"
    },
    '&:hover $actions': {
      opacity: .2,
    },
    '&:hover $archiveButton': {
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
  }
})

const dismissRecommendationTooltip = "Don't remind me to finish reading this sequence unless I visit it again";

const archiveDraftTooltip = "Archive this draft (hide from list)"

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

const PostsItem2 = ({
  post,
  tagRel=null,
  defaultToShowComments=false,
  sequenceId, 
  chapter,
  terms,
  resumeReading,
  dismissRecommendation,
  toggleDeleteDraft, 
  showBottomBorder=true,
  showQuestionTag=true,
  showDraftTag=true,
  showPersonalIcon=true,
  showIcons=true,
  showPostedAt=true,
  defaultToShowUnreadComments=false,
  dense=false,
  bookmark=false,
  showNominationCount=false,
  showReviewCount=false,
  hideAuthor=false,
  hideTrailingButtons=false,
  tooltipPlacement="bottom-end",
  classes,
  curatedIconLeft=false,
  strikethroughTitle=false,
  translucentBackground=false,
  forceSticky=false,
  showReadCheckbox=false
}: {
  /** post: The post displayed.*/
  post: PostsList,
  /** tagRel: (Optional) The relationship between this post and a tag. If
  /* provided, UI will be shown with the score and voting on this post's
  /* relevance to that tag.*/
  tagRel?: WithVoteTagRel|null,
  /** defaultToShowComments: (bool) If set, comments will be expanded by default.*/
  defaultToShowComments?: boolean,
  /** sequenceId, chapter: If set, these will be used for making a nicer URL.*/
  sequenceId?: string,
  chapter?: any,
  /** index: If this is part of a list of PostsItems, its index (starting from
  /* zero) into that list. Used for special casing some styling at start of
  /* the list.*/
  index?: number,
  /**
   * terms: If this is part of a list generated from a query, the terms of that
   * query. Used for figuring out which sticky icons to apply, if any.
   */
  terms?: any,
  /** resumeReading: If this is a Resume Reading suggestion, the corresponding
  /* partiallyReadSequenceItem (see schema in users/schema). Used for
  /* the sequence-image background.*/
  resumeReading?: any,
  /** dismissRecommendation: If this is a Resume Reading suggestion, a callback to dismiss it.*/
  dismissRecommendation?: any,
  /** if this a draft, a callback to archive/unarchive it */
  toggleDeleteDraft?: (post: PostsList) => void,
  showBottomBorder?: boolean,
  showQuestionTag?: boolean,
  showDraftTag?: boolean,
  showPersonalIcon?: boolean
  showIcons?: boolean,
  showPostedAt?: boolean,
  defaultToShowUnreadComments?: boolean,
  /** dense: (bool) Slightly reduce margins to make this denser. Used on the AllPosts page.*/
  dense?: boolean,
  /** bookmark: (bool) Whether this is a bookmark. Adds a clickable bookmark icon.*/
  bookmark?: boolean,
  /** showNominationCount: (bool) whether this should display it's number of Review nominations*/
  showNominationCount?: boolean,
  showReviewCount?: boolean,
  hideAuthor?: boolean,
  hideTrailingButtons?: boolean,
  tooltipPlacement?: PopperPlacementType,
  classes: ClassesType,
  curatedIconLeft?: boolean,
  strikethroughTitle?: boolean
  translucentBackground?: boolean,
  forceSticky?: boolean,
  showReadCheckbox?: boolean
}) => {
  const [showComments, setShowComments] = React.useState(defaultToShowComments);
  const [readComments, setReadComments] = React.useState(false);
  const [markedVisitedAt, setMarkedVisitedAt] = React.useState<Date|null>(null);
  const { isRead, recordPostView } = useRecordPostView(post);

  const currentUser = useCurrentUser();

  const toggleComments = React.useCallback(
    () => {
      recordPostView({post, extraEventProperties: {type: "toggleComments"}})
      setShowComments(!showComments);
      setReadComments(true);
    },
    [post, recordPostView, setShowComments, showComments, setReadComments]
  );

  const markAsRead = () => {
    recordPostView({post, extraEventProperties: {type: "markAsRead"}})
    setMarkedVisitedAt(new Date()) 
  }

  const compareVisitedAndCommentedAt = (lastVisitedAt, lastCommentedAt) => {
    const newComments = lastVisitedAt < lastCommentedAt;
    return (isRead && newComments && !readComments)
  }

  const hasUnreadComments = () => {
    const lastCommentedAt = postGetLastCommentedAt(post)
    const lastVisitedAt = markedVisitedAt || post.lastVisitedAt
    return compareVisitedAndCommentedAt(lastVisitedAt, lastCommentedAt)
  }

  const hasNewPromotedComments = () => {
    const lastVisitedAt = markedVisitedAt || post.lastVisitedAt
    const lastCommentPromotedAt = postGetLastCommentPromotedAt(post)
    return compareVisitedAndCommentedAt(lastVisitedAt, lastCommentPromotedAt)
  }

  const hadUnreadComments = () => {
    const lastCommentedAt = postGetLastCommentedAt(post)
    return compareVisitedAndCommentedAt(post.lastVisitedAt, lastCommentedAt)
  }

  const { PostsItemComments, PostsItemKarma, PostsTitle, PostsUserAndCoauthors, LWTooltip, 
    PostsPageActions, PostsItemIcons, PostsItem2MetaInfo, PostsItemTooltipWrapper,
    BookmarkButton, PostsItemDate, PostsItemNewCommentsWrapper, AnalyticsTracker,
    AddToCalendarButton, PostsItemReviewVote, ReviewPostButton, PostReadCheckbox } = (Components as ComponentTypes)

  const postLink = postGetPageUrl(post, false, sequenceId || chapter?.sequenceId);
  const postEditLink = `/editPost?${qs.stringify({postId: post._id, eventForm: post.isEvent})}`

  const renderComments = showComments || (defaultToShowUnreadComments && hadUnreadComments())
  const condensedAndHiddenComments = defaultToShowUnreadComments && !showComments

  const dismissButton = (currentUser && resumeReading &&
    <LWTooltip title={dismissRecommendationTooltip} placement="right">
      <CloseIcon onClick={() => dismissRecommendation()}/>
    </LWTooltip>
  )
  
  const archiveButton = (currentUser && post.draft && postCanDelete(currentUser, post) && 
    <LWTooltip title={archiveDraftTooltip} placement="right">
      <ArchiveIcon onClick={() => toggleDeleteDraft && toggleDeleteDraft(post)}/>
    </LWTooltip>
  )

  const commentTerms: CommentsViewTerms = {
    view:"postsItemComments", 
    limit:7, 
    postId: post._id, 
    after: (defaultToShowUnreadComments && !showComments) ? post.lastVisitedAt : null
  }

  const reviewCountsTooltip = `${post.nominationCount2019 || 0} nomination${(post.nominationCount2019 === 1) ? "" :"s"} / ${post.reviewCount2019 || 0} review${(post.nominationCount2019 === 1) ? "" :"s"}`

  return (
    <AnalyticsContext pageElementContext="postItem" postId={post._id} isSticky={isSticky(post, terms)}>
      <div className={classes.row}>
        {showReadCheckbox && <div className={classes.checkbox}>
          <PostReadCheckbox post={post} width={14} />
        </div>}
        <div className={classNames(
          classes.root,
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
                {tagRel && <Components.PostsItemTagRelevance tagRel={tagRel} post={post} />}
                <PostsItem2MetaInfo className={classes.karma}>
                  {post.isEvent ? <AddToCalendarButton post={post} /> : <PostsItemKarma post={post} />}
                </PostsItem2MetaInfo>

                <span className={classNames(classes.title, {[classes.hasSmallSubtitle]: !!resumeReading})}>
                  <AnalyticsTracker
                      eventType={"postItem"}
                      captureOnMount={(eventData) => eventData.capturePostItemOnMount}
                      captureOnClick={false}
                  >
                    <PostsTitle
                      postLink={post.draft ? postEditLink : postLink}
                      post={post}
                      read={isRead && !showReadCheckbox} // readCheckbox and post-title read-status don't aesthetically match
                      sticky={isSticky(post, terms) || forceSticky}
                      showQuestionTag={showQuestionTag}
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

                { !post.isEvent && !hideAuthor && <PostsItem2MetaInfo className={classes.author}>
                  <PostsUserAndCoauthors post={post} abbreviateIfLong={true} newPromotedComments={hasNewPromotedComments()}/>
                </PostsItem2MetaInfo>}

                {showPostedAt && !resumeReading && <PostsItemDate post={post} />}

                <div className={classes.mobileSecondRowSpacer}/>

                {<div className={classes.mobileActions}>
                  {!resumeReading && <PostsPageActions post={post} />}
                </div>}

                {showIcons && <div className={classes.nonMobileIcons}>
                  <PostsItemIcons post={post}/>
                </div>}

                {!resumeReading && <PostsItemComments
                  small={false}
                  commentCount={postGetCommentCount(post)}
                  onClick={toggleComments}
                  unreadComments={hasUnreadComments()}
                  newPromotedComments={hasNewPromotedComments()}
                />}

                {getReviewPhase() === "NOMINATIONS" && <PostsItemReviewVote post={post}/>}
                
                {postEligibleForReview(post) && postIsVoteable(post)  && getReviewPhase() === "REVIEWS" && <ReviewPostButton post={post} year={REVIEW_YEAR+""} reviewMessage={<LWTooltip title={<div><div>What was good about this post? How it could be improved? Does it stand the test of time?</div><p><em>{post.reviewCount || "No"} review{post.reviewCount !== 1 && "s"}</em></p></div>} placement="bottom">
                  Review
                </LWTooltip>}/>}

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
                  {dismissButton}
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

          {!hideTrailingButtons && <>
            <div className={classes.actions}>
              {dismissButton}
              {!resumeReading && <PostsPageActions post={post} vertical />}
            </div>
            <div className={classes.archiveButton}>
              {archiveButton}
            </div>
          </>}
          {renderComments && <div className={classes.newCommentsSection} onClick={toggleComments}>
            <PostsItemNewCommentsWrapper
              terms={commentTerms}
              post={post}
              treeOptions={{
                highlightDate: markedVisitedAt || post.lastVisitedAt,
                condensed: condensedAndHiddenComments,
                markAsRead: markAsRead,
              }}
            />
          </div>}
        </div>
      </div>
    </AnalyticsContext>
  )
};

const PostsItem2Component = registerComponent('PostsItem2', PostsItem2, {
  styles,
  stylePriority: 1,
  hocs: [withErrorBoundary],
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsItem2: typeof PostsItem2Component
  }
}
