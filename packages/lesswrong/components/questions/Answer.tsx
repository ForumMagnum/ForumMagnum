import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import withErrorBoundary from '../common/withErrorBoundary'
import MoreHorizIcon from '@/lib/vendor/@material-ui/icons/src/MoreHoriz';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from 'classnames';
import { metaNoticeStyles } from '../comments/CommentsItem/CommentsItemMeta';
import { useCommentLink, useCommentLinkState } from '../comments/CommentsItem/useCommentLink';
import { isFriendlyUI } from '../../themes/forumTheme';
import { CommentTreeNode } from '../../lib/utils/unflatten';
import type { ContentItemBodyInner } from '../common/ContentItemBody';
import { useVote } from '../votes/withVote';
import { getVotingSystemByName } from '../../lib/voting/getVotingSystem';
import type { CommentTreeOptions } from '../comments/commentTree';
import { commentPermalinkStyleSetting } from '@/lib/publicSettings';
import { CommentsEditForm } from "../comments/CommentsEditForm";
import { SmallSideVote } from "../votes/SmallSideVote";
import { AnswerCommentsList } from "./AnswerCommentsList";
import { CommentsMenu } from "../dropdowns/comments/CommentsMenu";
import { ForumIcon } from "../common/ForumIcon";
import { CommentBody } from "../comments/CommentsItem/CommentBody";
import { CommentsItemDate } from "../comments/CommentsItem/CommentsItemDate";
import { UsersName } from "../users/UsersName";
import { Typography } from "../common/Typography";
import { CommentBottom } from "../comments/CommentsItem/CommentBottom";
import { CommentsNewForm } from "../comments/CommentsNewForm";
import { HoveredReactionContextProvider } from "../votes/lwReactions/HoveredReactionContextProvider";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    paddingTop: theme.spacing.unit*2.5,
    paddingLeft: theme.spacing.unit*2.5,
    paddingRight: theme.spacing.unit*2.5,
    border: `solid 2px ${theme.palette.grey[300]}`,
    [theme.breakpoints.down('md')]: {
      marginLeft: "auto",
      marginRight: "auto"
    }
  },
  answer: {

  },
  answerHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing.unit*2,
    flexWrap: "wrap",
  },
  author: {
    display: 'inline-block',
    fontWeight: 600,
    ...theme.typography.postStyle,
    ...(isFriendlyUI
      ? {
        fontFamily: theme.palette.fonts.sansSerifStack,
      }
      : {}),
  },
  date: {
    display: 'inline-block',
    marginLeft: 10,
    flexGrow: 0,
    flexShrink: 0,
  },
  vote: {
    display: "flex",
    marginLeft: 10,
    fontFamily: theme.typography.commentStyle.fontFamily,
    color: theme.palette.grey[500],
    flexShrink: 0,
    flexGrow: 1,
    position: "relative",
    top: isFriendlyUI ? 0 : -4,
  },
  footer: {
    marginTop: 5,
    marginLeft: -13,
    display:"flex",
    alignItems:"center",
  },
  separator: {
    borderColor: theme.palette.grey[200],
    width: "25%",
    marginTop: theme.spacing.unit*4,
    marginBottom: theme.spacing.unit*8
  },
  linkIcon: {
    fontSize: "1.2rem",
    color: theme.palette.icon.dim,
    margin: "0 4px",
    position: "relative",
  },
  linkIconHighlighted: {
    strokeWidth: "0.7px",
    stroke: "currentColor",
    color: theme.palette.primary.main
  },
  menu: {
    opacity:.5,
    cursor: "pointer",
    '&:hover': {
      opacity:1
    },
  },
  deletedSection: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    marginTop: 50
  },
  deleted: {
    color: theme.palette.grey[500]
  },
  footerVote: {
    fontSize: 42,
    textAlign: "center",
    marginRight: theme.spacing.unit
  },
  footerRight: {
    marginTop: theme.spacing.unit*2
  },
  newComment: {
    marginTop: 16,
    color: theme.palette.grey[500]
  },
  metaData: {
    textAlign: 'right'
  },
  promoted: {
    border: `solid 2px ${theme.palette.lwTertiary.main}`,
  },
  metaNotice: {
    ...metaNoticeStyles(theme),
    ...theme.typography.commentStyle,
    marginTop: -12,
    marginBottom: 10
  },
  retracted: {
    textDecoration: "line-through",
  },
})

const AnswerInner = ({ comment, post, childComments, classes }: {
  comment: CommentsList,
  post: PostsList,
  childComments: CommentTreeNode<CommentsList>[],
  classes: ClassesType<typeof styles>,
}) => {
  const [showEdit,setShowEdit] = useState(false);
  const [replyFormIsOpen, setReplyFormIsOpen] = useState(false);
  const commentBodyRef = useRef<ContentItemBodyInner|null>(null); // passed into CommentsItemBody for use in InlineReactSelectionWrapper
  const votingSystemName = comment.votingSystem || "default";
  const votingSystem = getVotingSystemByName(votingSystemName);
  const voteProps = useVote(comment, "Comments", votingSystem);
  const { scrollToCommentId } = useCommentLinkState();
  
  const setShowEditTrue = useCallback(() => {
    setShowEdit(true)
  }, [setShowEdit]);
  const hideEdit = useCallback(() => {
    setShowEdit(false)
  }, [setShowEdit]);
  
  const openReplyForm = useCallback(() => {
    setReplyFormIsOpen(true);
  }, []);
  const closeReplyForm = useCallback(() => {
    setReplyFormIsOpen(false);
  }, []);

  const CommentLinkWrapper = useCommentLink({comment, post});
  const menuIcon = isFriendlyUI
    ? undefined
    : <MoreHorizIcon />;

  const treeOptions: CommentTreeOptions = useMemo(() => ({
    postPage: true,
    showCollapseButtons: true,
    post: post,
    switchAlternatingHighlights: true,
  }), [post]);

  // Note: This could be decoupled from `commentPermalinkStyleSetting` without any side effects
  const highlightLinkIcon = commentPermalinkStyleSetting.get() === 'in-context' && scrollToCommentId === comment._id

  return (
    <div className={classNames(classes.root, {[classes.promoted]: comment.promoted})}>
      { comment.deleted ?
        <div className={classes.deletedSection} id={comment._id}>
          <Typography variant="body2" className={classes.deleted}>
            Answer was deleted
          </Typography>
          {isFriendlyUI &&
            <CommentLinkWrapper>
              <ForumIcon icon="Link" className={classNames(classes.linkIcon, {[classes.linkIconHighlighted]: highlightLinkIcon})} />
            </CommentLinkWrapper>
          }
          <CommentsMenu
            className={classes.menu}
            showEdit={setShowEditTrue}
            comment={comment}
            post={post}
            icon={menuIcon}
          />
        </div>
        :
        <div>
          <AnalyticsContext pageElementContext="answerItem">
          <HoveredReactionContextProvider voteProps={voteProps}>
            <div className={classes.answer} id={comment._id}>
              <div className={classes.answerHeader}>
                {comment.user && <Typography variant="body1" className={classes.author}>
                  { <UsersName user={comment.user} />}
                </Typography >}
                <Typography variant="subheading" className={classes.date}>
                  <CommentsItemDate comment={comment} post={post}/>
                </Typography>
                <span className={classes.vote}>
                  <SmallSideVote document={comment} collectionName="Comments"/>
                </span>
                {isFriendlyUI &&
                  <CommentLinkWrapper>
                    <ForumIcon icon="Link" className={classNames(classes.linkIcon, {[classes.linkIconHighlighted]: highlightLinkIcon})} />
                  </CommentLinkWrapper>
                }
                <CommentsMenu
                  className={classes.menu}
                  showEdit={setShowEditTrue}
                  comment={comment}
                  post={post}
                  icon={menuIcon}
                />
              </div>
              { comment.promotedByUser && <div className={classes.metaNotice}>
                Pinned by {comment.promotedByUser.displayName}
              </div>}
              { showEdit
                ? <CommentsEditForm
                    comment={comment}
                    successCallback={hideEdit}
                    cancelCallback={hideEdit}
                  />
                : <CommentBody
                    commentBodyRef={commentBodyRef}
                    comment={comment}
                    voteProps={voteProps}
                  />
              }
              <CommentBottom
                comment={comment}
                post={post}
                treeOptions={treeOptions}
                votingSystem={votingSystem}
                voteProps={voteProps}
                commentBodyRef={commentBodyRef}
                replyButton={
                  !replyFormIsOpen && <Typography variant="body2" onClick={()=>setReplyFormIsOpen(true)} className={classNames(classes.newComment)}>
                    <a>Add Comment</a>
                  </Typography>
                }
              />
            </div>
          </HoveredReactionContextProvider>
          </AnalyticsContext>
          <div>
            {replyFormIsOpen &&
              <div>
                <CommentsNewForm
                  post={post}
                  parentComment={comment}
                  prefilledProps={{
                    parentAnswerId: comment._id,
                  }}
                  successCallback={closeReplyForm}
                  cancelCallback={closeReplyForm}
                  type="reply"
                />
              </div>
            }
          </div>
          <AnswerCommentsList
            post={post}
            commentTree={childComments}
            treeOptions={treeOptions}
            parentAnswer={comment}
          />
        </div>
      }
    </div>
  )
}

export const Answer = registerComponent('Answer', AnswerInner, {
  styles,
  hocs: [withErrorBoundary]
});


