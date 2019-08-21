import { Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "../../lib/collections/comments";
import { shallowEqual, shallowEqualExcept } from '../../lib/modules/utils/componentUtils';
import { Posts } from '../../lib/collections/posts';
import withGlobalKeydown from '../common/withGlobalKeydown';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import { TRUNCATION_KARMA_THRESHOLD } from '../../lib/editor/ellipsize'

const styles = theme => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  settingsButton: {
    display: "flex",
    alignItems: "center"
  }
})

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

class CommentsList extends Component {
  state = { expandAllThreads: false }

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

  shouldComponentUpdate(nextProps, nextState) {
    if(!shallowEqual(this.state, nextState))
      return true;

    if(!shallowEqualExcept(this.props, nextProps,
      ["post","comments","updateComment"]))
    {
      return true;
    }

    if(this.props.post==null || nextProps.post==null || this.props.post._id != nextProps.post._id ||
      (this.props.post.contents && this.props.post.contents.version !== nextProps.post.contents && nextProps.post.contents.version))
      return true;

    if(this.commentTreesDiffer(this.props.comments, nextProps.comments))
      return true;
    return false;
  }

  commentTreesDiffer(oldComments, newComments) {
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
    const { currentUser, classes, totalComments } = this.props;
    const { expandAllThreads } = this.state
    const { SettingsIcon, CommentsListMeta, LoginPopupButton } = Components
    if  (totalComments > POST_COMMENT_COUNT_TRUNCATE_THRESHOLD) {

      const expandTooltip = `Posts with more than ${POST_COMMENT_COUNT_TRUNCATE_THRESHOLD} comments automatically truncate replies with less than ${TRUNCATION_KARMA_THRESHOLD} karma. Click or press ⌘F to expand all.`

      return <CommentsListMeta>
        <span>
          Some comments are truncated due to high volume. <Tooltip title={expandTooltip}>
            <a className={!expandAllThreads && classes.button} onClick={()=>this.setState({expandAllThreads: true})}>(⌘F to expand all)</a>
          </Tooltip>
        </span>
        {currentUser 
          ? 
            <Tooltip title="Go to your settings page to update your Comment Truncation Options">
              <Link to="/account">
                <SettingsIcon label="Change default truncation settings" />
              </Link>
            </Tooltip>
          : 
            <LoginPopupButton title={"Login to change default truncation settings"}>
              <SettingsIcon label="Change truncation settings" />
            </LoginPopupButton>
        }
      </CommentsListMeta>
    }
  }

  render() {
    const { comments, currentUser, highlightDate, updateComment, post, postPage, totalComments, condensed, startThreadTruncated, parentAnswerId, defaultNestingLevel = 1, hideReadComments, lastCommentId, parentCommentId=null } = this.props;

    const { expandAllThreads } = this.state
    const { lastVisitedAt } = post
    const lastCommentedAt = Posts.getLastCommentedAt(post)
    const unreadComments = lastVisitedAt < lastCommentedAt;

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
                currentUser={currentUser}
                comment={comment.item}
                parentCommentId={parentCommentId}
                nestingLevel={defaultNestingLevel}
                lastCommentId={lastCommentId}
                //eslint-disable-next-line react/no-children-prop
                children={comment.children}
                key={comment.item._id}
                highlightDate={highlightDate}
                updateComment={updateComment}
                post={post}
                postPage={postPage}
                parentAnswerId={parentAnswerId}
                condensed={condensed}
                hideReadComments={hideReadComments}
                shortform={post.shortform}
                child={defaultNestingLevel > 1}
              />)
            }
          </div>
        </Components.ErrorBoundary>
      )
    } else {
      return (
        <div>
          <p>
            <FormattedMessage id="comments.no_comments"/>
          </p>
        </div>
      )
    }
  }
}

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
};


registerComponent('CommentsList', CommentsList, [withEdit, withEditOptions], withGlobalKeydown, withStyles(styles, {name:"CommentsList"}));
