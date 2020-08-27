import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { Component } from 'react';
import { shallowEqual, shallowEqualExcept } from '../../lib/utils/componentUtils';
import { Posts } from '../../lib/collections/posts';
import withGlobalKeydown from '../common/withGlobalKeydown';
import { Link } from '../../lib/reactRouterWrapper';
import { TRUNCATION_KARMA_THRESHOLD } from '../../lib/editor/ellipsize'
import withUser from '../common/withUser';
import { CommentTreeNode } from '../../lib/utils/unflatten';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
})

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

interface ExternalProps {
  comments: Array<CommentTreeNode<CommentsList>>,
  totalComments?: number,
  highlightDate?: Date,
  post?: PostsBase,
  tag?: TagBasicInfo,
  postPage?: boolean,
  condensed?: boolean,
  startThreadTruncated?: boolean,
  parentAnswerId?: string,
  defaultNestingLevel?: number,
  lastCommentId?: string,
  markAsRead?: any,
  parentCommentId?: string,
  forceSingleLine?: boolean,
  hideSingleLineMeta?: boolean,
  enableHoverPreview?: boolean,
  forceNotSingleLine?: boolean,
}
interface CommentsListProps extends ExternalProps, WithUserProps, WithGlobalKeydownProps, WithStylesProps {
}
interface CommentsListState {
  expandAllThreads: boolean,
}

class CommentsListClass extends Component<CommentsListProps,CommentsListState> {
  state: CommentsListState = { expandAllThreads: false }

  handleKeyDown = (event) => {
    const F_Key = 70
    if ((event.metaKey || event.ctrlKey) && event.keyCode == F_Key) {
      this.setState({expandAllThreads: true});
    }
  }

  componentDidMount() {
    const { addKeydownListener } = this.props
    addKeydownListener(this.handleKeyDown);
  }

  shouldComponentUpdate(nextProps: CommentsListProps, nextState: CommentsListState) {
    if(!shallowEqual(this.state, nextState))
      return true;

    if(!shallowEqualExcept(this.props, nextProps,
      ["post","comments"]))
    {
      return true;
    }

    if ((this.props.post==null) != (nextProps.post==null))
      return true;
    if (this.props.post?._id != nextProps.post?._id)
      return true;
    if ((this.props.post as any)?.contents?.version != (nextProps.post as any)?.contents?.version)
      return true;

    if(this.commentTreesDiffer(this.props.comments, nextProps.comments))
      return true;
    return false;
  }

  commentTreesDiffer(oldComments: Array<CommentTreeNode<CommentsList>>, newComments: Array<CommentTreeNode<CommentsList>>) {
    if(oldComments===null && newComments!==null) return true;
    if(oldComments!==null && newComments===null) return true;
    if(newComments===null) return false;

    if(oldComments.length != newComments.length)
      return true;
    for(let i=0; i<oldComments.length; i++) {
      if(oldComments[i].item != newComments[i].item)
        return true;
      if(this.commentTreesDiffer(oldComments[i].children, newComments[i].children))
        return true;
    }
    return false;
  }

  renderExpandOptions = () => {
    const { currentUser, classes, totalComments=0 } = this.props;
    const { expandAllThreads } = this.state
    const { SettingsButton, CommentsListMeta, LoginPopupButton, LWTooltip } = Components
    if  (totalComments > POST_COMMENT_COUNT_TRUNCATE_THRESHOLD) {

      const expandTooltip = `Posts with more than ${POST_COMMENT_COUNT_TRUNCATE_THRESHOLD} comments automatically truncate replies with less than ${TRUNCATION_KARMA_THRESHOLD} karma. Click or press ⌘F to expand all.`

      return <CommentsListMeta>
        <span>
          Some comments are truncated due to high volume. <LWTooltip title={expandTooltip}>
            <a className={!expandAllThreads && classes.button} onClick={()=>this.setState({expandAllThreads: true})}>(⌘F to expand all)</a>
          </LWTooltip>
        </span>
        {currentUser 
          ? 
            <LWTooltip title="Go to your settings page to update your Comment Truncation Options">
              <Link to="/account">
                <SettingsButton label="Change default truncation settings" />
              </Link>
            </LWTooltip>
          : 
            <LoginPopupButton title={"Login to change default truncation settings"}>
              <SettingsButton label="Change truncation settings" />
            </LoginPopupButton>
        }
      </CommentsListMeta>
    }
  }

  render() {
    const { comments, highlightDate, post, postPage, tag, totalComments=0, condensed, startThreadTruncated, parentAnswerId, defaultNestingLevel = 1, lastCommentId, markAsRead, parentCommentId, forceSingleLine, hideSingleLineMeta, enableHoverPreview, forceNotSingleLine } = this.props;

    const { expandAllThreads } = this.state
    const lastVisitedAt = post?.lastVisitedAt;
    const lastCommentedAt = post ? Posts.getLastCommentedAt(post) : null;
    const unreadComments = lastVisitedAt && lastCommentedAt && (lastVisitedAt < lastCommentedAt);

    if (comments) {
      return (
        <Components.ErrorBoundary>
          { this.renderExpandOptions()}
          <div>
            {comments.map(comment =>
              <Components.CommentsNode
                startThreadTruncated={startThreadTruncated || totalComments >= POST_COMMENT_COUNT_TRUNCATE_THRESHOLD}
                expandAllThreads={expandAllThreads}
                unreadComments={unreadComments}
                comment={comment.item}
                parentCommentId={parentCommentId}
                nestingLevel={defaultNestingLevel}
                lastCommentId={lastCommentId}
                //eslint-disable-next-line react/no-children-prop
                children={comment.children}
                key={comment.item._id}
                highlightDate={highlightDate}
                post={post}
                tag={tag}
                postPage={postPage}
                parentAnswerId={parentAnswerId}
                condensed={condensed}
                forceSingleLine={forceSingleLine}
                forceNotSingleLine={forceNotSingleLine}
                hideSingleLineMeta={hideSingleLineMeta}
                enableHoverPreview={enableHoverPreview}
                shortform={post?.shortform}
                child={defaultNestingLevel > 1}
                markAsRead={markAsRead}
              />)
            }
          </div>
        </Components.ErrorBoundary>
      )
    } else {
      return (
        <div>
          <p>No comments to display.</p>
        </div>
      )
    }
  }
}


const CommentsListComponent = registerComponent<ExternalProps>(
  'CommentsList', CommentsListClass, {
    styles, hocs: [
      withUser,
      withGlobalKeydown,
    ]
  }
);

declare global {
  interface ComponentTypes {
    CommentsList: typeof CommentsListComponent,
  }
}

