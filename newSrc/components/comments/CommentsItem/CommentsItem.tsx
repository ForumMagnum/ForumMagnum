import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { withMessages } from '../../common/withMessages';
import React, { Component } from 'react';
import Users from '../../../lib/collections/users/collection';
import classNames from 'classnames';
import { shallowEqual, shallowEqualExcept } from '../../../lib/utils/componentUtils';
import withErrorBoundary from '../../common/withErrorBoundary';
import withUser from '../../common/withUser';
import { Link } from '../../../lib/reactRouterWrapper';
import { Posts } from "../../../lib/collections/posts/collection";
import { Tags } from "../../../lib/collections/tags/collection";
import { Comments } from "../../../lib/collections/comments";
import { AnalyticsContext } from "../../../lib/analyticsEvents";

// Shared with ParentCommentItem
export const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: theme.spacing.unit*1.5,
    paddingRight: theme.spacing.unit*1.5,
    "&:hover $menu": {
      opacity:1
    }
  },
  body: {
    borderStyle: "none",
    padding: 0,
    ...theme.typography.commentStyle,
  },
  menu: {
    opacity:.35,
    marginRight:-5
  },
  metaRight: {
    float: "right"
  },
  outdatedWarning: {
    float: "right",
    position: 'relative',
    [theme.breakpoints.down('xs')]: {
      float: "none",
      marginTop: 7,
      display: 'block'
    }
  },
  replyLink: {
    marginRight: 5,
    display: "inline",
    color: "rgba(0,0,0,.5)",
    "@media print": {
      display: "none",
    },
  },
  collapse: {
    marginRight: 5,
    opacity: 0.8,
    fontSize: "0.8rem",
    lineHeight: "1rem",
    paddingBottom: 4,
    display: "inline-block",
    verticalAlign: "middle",

    "& span": {
      fontFamily: "monospace",
    }
  },
  firstParentComment: {
    marginLeft: -theme.spacing.unit*1.5,
    marginRight: -theme.spacing.unit*1.5
  },
  meta: {
    "& > div": {
      display: "inline-block",
      marginRight: 5,
    },
    
    marginBottom: 8,
    color: "rgba(0,0,0,0.5)",
    paddingTop: ".6em",
  
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: "rgba(0,0,0,0.3) !important",
    },
  },
  bottom: {
    paddingBottom: 5,
    fontSize: 12,
    minHeight: 12
  },
  replyForm: {
    marginTop: 2,
    marginBottom: 8,
    border: "solid 1px rgba(0,0,0,.2)",
  },
  deleted: {
    backgroundColor: "#ffefef",
  },
  moderatorHat: {
    marginRight: 8,
  },
  username: {
    marginRight: 10,
  },
  metaNotice: {
    color: theme.palette.lwTertiary.main,
    fontStyle: "italic",
    fontSize: "1rem",
    marginBottom: theme.spacing.unit
  },
  postTitle: {
    paddingTop: theme.spacing.unit,
    ...theme.typography.commentStyle,
    display: "block",
    color: theme.palette.grey[600]
  }
})

interface ExternalProps {
  refetch?: any,
  comment: CommentsList|CommentsListWithParentMetadata,
  postPage?: boolean,
  nestingLevel: number,
  showPostTitle?: boolean,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  collapsed?: boolean,
  isParentComment?: boolean,
  parentCommentId?: string,
  scrollIntoView?: ()=>void,
  toggleCollapse?: ()=>void,
  truncated: boolean,
  parentAnswerId?: string|undefined,
  hideReply?: boolean,
}
interface CommentsItemProps extends ExternalProps, WithMessagesProps, WithUserProps, WithStylesProps {
}
interface CommentsItemState {
  showReply: boolean,
  showEdit: boolean,
  showParent: boolean,
}

export class CommentsItem extends Component<CommentsItemProps,CommentsItemState> {
  constructor(props: CommentsItemProps) {
    super(props);
    this.state = {
      showReply: false,
      showEdit: false,
      showParent: false
    };
  }

  shouldComponentUpdate(nextProps: CommentsItemProps, nextState: CommentsItemState) {
    if(!shallowEqual(this.state, nextState))
      return true;
    if(!shallowEqualExcept(this.props, nextProps, ["post"]))
      return true;
    if (((nextProps.post as any)?.contents?.version) !== ((this.props.post as any)?.contents?.version))
      return true;
    return false;
  }

  showReply = (event: React.MouseEvent) => {
    event.preventDefault();
    this.setState({showReply: true});
  }

  replyCancelCallback = () => {
    this.setState({showReply: false});
}

  replySuccessCallback = () => {
    const { refetch } = this.props 
    if (refetch) {
      refetch()
    }
    this.setState({showReply: false});
  }

  setShowEdit = () => {
    this.setState({showEdit: true});
  }

  editCancelCallback = () => {
    this.setState({showEdit: false});
  }

  editSuccessCallback = () => {
    const { refetch } = this.props 
    if (refetch) {
      refetch()
    }
    this.setState({showEdit: false});
  }

  removeSuccessCallback = () => {
    this.props.flash({messageString: "Successfully deleted comment", type: "success"});
  }

  toggleShowParent = () => {
    this.setState({showParent:!this.state.showParent})
  }

  render() {
    const { comment, postPage, nestingLevel=1, showPostTitle, classes, post, collapsed, isParentComment, parentCommentId, scrollIntoView, tag } = this.props

    const { ShowParentComment, CommentsItemDate, CommentUserName, CommentShortformIcon, SmallSideVote } = Components

    if (!comment) {
      return null;
    }
    
    return (
        <AnalyticsContext pageElementContext="commentItem" commentId={comment._id}>
          <div className={
            classNames(
              classes.root,
              "recent-comments-node",
              {
                [classes.deleted]: comment.deleted && !comment.deletedPublic,
              },
            )}
          >
            { comment.parentCommentId && this.state.showParent && (
              <div className={classes.firstParentComment}>
                <Components.ParentCommentSingle
                  post={post} tag={tag}
                  documentId={comment.parentCommentId}
                  nestingLevel={nestingLevel - 1}
                  truncated={false}
                  key={comment.parentCommentId}
                />
              </div>
            )}

            {showPostTitle && hasPostField(comment) && comment.post && <Link className={classes.postTitle} to={Posts.getPageUrl(comment.post)}>{comment.post.title}</Link>}
            {showPostTitle && hasTagField(comment) && comment.tag && <Link className={classes.postTitle} to={Tags.getUrl(comment.tag)}>{comment.tag.name}</Link>}

            <div className={classes.body}>
              <div className={classes.meta}>
                { !parentCommentId && !comment.parentCommentId && isParentComment &&
                  <div className={classes.usernameSpacing}>○</div>
                }
                {post && <CommentShortformIcon comment={comment} post={post} />}
                { parentCommentId!=comment.parentCommentId &&
                  <ShowParentComment
                    comment={comment}
                    active={this.state.showParent}
                    onClick={this.toggleShowParent}
                  />
                }
                { (postPage || this.props.collapsed) && <a className={classes.collapse} onClick={this.props.toggleCollapse}>
                  [<span>{this.props.collapsed ? "+" : "-"}</span>]
                </a>
                }
                <span className={classes.username}>
                  <CommentUserName comment={comment}/>
                </span>
                <CommentsItemDate
                  comment={comment} post={post} tag={tag}
                  scrollIntoView={scrollIntoView}
                  scrollOnClick={postPage && !isParentComment}
                />
                {comment.moderatorHat && <span className={classes.moderatorHat}>
                  Moderator Comment
                </span>}
                <SmallSideVote
                  document={comment}
                  collection={Comments}
                  hideKarma={post?.hideCommentKarma}
                />

                {!isParentComment && this.renderMenu()}
                {post && <span className={classes.outdatedWarning}>
                  <Components.CommentOutdatedWarning comment={comment} post={post} />
                </span>}
                {comment.nominatedForReview && <Link to={"/nominations"} className={classes.metaNotice}>
                  {`Nomination for ${comment.nominatedForReview}`}
                </Link>}
                {comment.reviewingForReview && <Link to={"/reviews"} className={classes.metaNotice}>
                {`Review for ${comment.reviewingForReview}`}
              </Link>}
              </div>
              { comment.promoted && comment.promotedByUser && <div className={classes.metaNotice}>
                Promoted by {comment.promotedByUser.displayName}
              </div>}
              {this.renderBodyOrEditor()}
              {!comment.deleted && !collapsed && this.renderCommentBottom()}
            </div>
            { this.state.showReply && !this.props.collapsed && this.renderReply() }
          </div>
        </AnalyticsContext>
    )
  }
  
  renderMenu = () => {
    const { classes, comment, post } = this.props;
    const { CommentsMenu } = Components;
    return (
      <span className={classes.metaRight}>
        <span className={classes.menu}>
          <AnalyticsContext pageElementContext="tripleDotMenu">
            <CommentsMenu
              comment={comment}
              post={post}
              showEdit={this.setShowEdit}
            />
          </AnalyticsContext>
        </span>
      </span>
    )
  }
  
  renderBodyOrEditor = () => {
    const { comment, truncated, collapsed, postPage } = this.props;
    const { showEdit } = this.state;
    
    if (showEdit) {
      return <Components.CommentsEditForm
        comment={comment}
        successCallback={this.editSuccessCallback}
        cancelCallback={this.editCancelCallback}
      />
    } else {
      return <Components.CommentBody
        truncated={truncated}
        collapsed={collapsed}
        comment={comment}
        postPage={postPage}
      />
    }
  }

  renderCommentBottom = () => {
    const { comment, currentUser, collapsed, classes, hideReply } = this.props;
    const { CommentBottomCaveats } = Components

    if (!collapsed) {
      const blockedReplies = comment.repliesBlockedUntil && new Date(comment.repliesBlockedUntil) > new Date();

      const showReplyButton = (
        !hideReply &&
        !comment.deleted &&
        (!blockedReplies || Users.canDo(currentUser,'comments.replyOnBlocked.all')) &&
        // FIXME Users.isAllowedToComment depends on some post metadatadata that we
        // often don't want to include in fragments, producing a type-check error
        // here. We should do something more complicated to give client-side feedback
        // if you're banned.
        // @ts-ignore
        (!currentUser || Users.isAllowedToComment(currentUser, this.props.post))
      )

      return (
        <div className={classes.bottom}>
          <CommentBottomCaveats comment={comment}/>
          { showReplyButton &&
            <a className={classNames("comments-item-reply-link", classes.replyLink)} onClick={this.showReply}>
              Reply
            </a>
          }
        </div>
      )
    }
  }

  renderReply = () => {
    const { post, comment, classes, parentAnswerId, nestingLevel=1 } = this.props
    const levelClass = (nestingLevel + 1) % 2 === 0 ? "comments-node-even" : "comments-node-odd"

    return (
      <div className={classNames(classes.replyForm, levelClass)}>
        <Components.CommentsNewForm
          post={post}
          parentComment={comment}
          successCallback={this.replySuccessCallback}
          cancelCallback={this.replyCancelCallback}
          prefilledProps={{
            parentAnswerId: parentAnswerId ? parentAnswerId : null
          }}
          type="reply"
        />
      </div>
    )
  }
}

const CommentsItemComponent = registerComponent<ExternalProps>(
  'CommentsItem', CommentsItem, {
    styles,
    hocs: [ withMessages, withUser, withErrorBoundary ]
  }
);

function hasPostField(comment: CommentsList | CommentsListWithParentMetadata): comment is CommentsListWithParentMetadata {
  return !!(comment as CommentsListWithParentMetadata).post
}

function hasTagField(comment: CommentsList | CommentsListWithParentMetadata): comment is CommentsListWithParentMetadata {
  return !!(comment as CommentsListWithParentMetadata).tag
}

declare global {
  interface ComponentTypes {
    CommentsItem: typeof CommentsItemComponent,
  }
}
