import { Components, registerComponent } from 'meteor/vulcan:core';
import { withLocation } from '../../lib/routeUtil';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import withErrorBoundary from '../common/withErrorBoundary';
import withUser from '../common/withUser';
import { shallowEqual, shallowEqualExcept } from '../../lib/modules/utils/componentUtils';

const KARMA_COLLAPSE_THRESHOLD = -4;
const HIGHLIGHT_DURATION = 3

const styles = theme => ({
  node: {
    cursor: "default",
    // Higher specificity to override child class (variant syntax)
    '&$new': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}`,
      
      '&:hover': {
        borderLeft: `solid 5px ${theme.palette.secondary.main}`
      },
    },
    '&$deleted': {
      opacity: 0.6
    }
  },
  child: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    borderLeft: `solid 1px ${theme.palette.grey[300]}`,
    borderTop: `solid 1px ${theme.palette.grey[300]}`,
    borderBottom: `solid 1px ${theme.palette.grey[300]}`,
  },
  new: {},
  deleted: {},
  parentScroll: {
    position: "absolute",
    top:0,
    left:0,
    width:8,
    height:"100%",
    cursor:"pointer",
    '&:hover': {
      backgroundColor: "rgba(0,0,0,.075)"
    }
  },
  isAnswer: {
    border: `solid 2px ${theme.palette.grey[300]}`,
  },
  answerChildComment: {
    marginBottom: theme.spacing.unit,
    border: `solid 1px ${theme.palette.grey[300]}`,
  },
  childAnswerComment: {
    borderRight: "none"
  },
  oddAnswerComment: {
    backgroundColor: 'white'
  },
  answerLeafComment: {
    paddingBottom: 0
  },
  isSingleLine: {
    marginBottom: 0,
    borderBottom: "none",
    borderTop: "solid 1px rgba(0,0,0,.15)",
    '&.comments-node-root':{
      marginBottom: -1,
      borderBottom: "solid 1px rgba(0,0,0,.2)",
    }
  },
  commentHidden: {
    border: "none !important",
    background: "none"
  },
  shortformTop: {
    '&&': {
      marginTop: theme.spacing.unit*4,
      marginBottom: 0
    }
  },
  children: {
    position: "relative"
  },
  '@keyframes higlight-animation': {
    from: {
      backgroundColor: theme.palette.grey[300],
      borderColor: "black"
    },
    to: { 
      backgroundColor: "none",
      borderColor: "rgba(0,0,0,.15)"
    }
  },
  highlightAnimation: {
    animation: `$higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
  gapIndicator: {
    border: `solid 1px ${theme.palette.grey[300]}`,
    backgroundColor: theme.palette.grey[100],
    marginLeft: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
  }
})

class CommentsNode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: this.beginCollapsed(),
      truncated: this.beginTruncated(),
      singleLine: this.beginSingleLine(),
      truncatedStateSet: false,
      highlighted: false,
    };
    this.scrollTargetRef = React.createRef();
  }

  beginCollapsed = () => {
    const { comment } = this.props
    return (
      comment.deleted ||
      comment.baseScore < KARMA_COLLAPSE_THRESHOLD
    )
  }

  beginTruncated = () => {
    return this.props.startThreadTruncated
  }
  
  beginSingleLine = () => {
    const { comment, condensed, lastCommentId, forceSingleLine, shortform, nestingLevel, postPage } = this.props
    const mostRecent = lastCommentId === comment._id
    const lowKarmaOrCondensed = (comment.baseScore < 10 || condensed)
    const shortformAndTop = (nestingLevel === 1) && shortform
    const postPageAndTop = (nestingLevel === 1) && postPage
    
    if (forceSingleLine)
      return true;
    
    return (
      this.isTruncated() &&
      lowKarmaOrCondensed &&
      !(mostRecent && condensed) &&
      !(shortformAndTop) && 
      !(postPageAndTop)
    )
  }

  componentDidMount() {
    const { comment, post, location } = this.props
    let commentHash = location.hash;
    if (comment && commentHash === ("#" + comment._id) && post) {
      setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
        this.scrollIntoView()
      }, 0);
    }
  }

  isInViewport() {
    if (!this.scrollTargetRef) return false;
    const top = this.scrollTargetRef.current?.getBoundingClientRect().top;
    return (top >= 0) && (top <= window.innerHeight);
  }

  scrollIntoView = (behavior="smooth") => {
    if (!this.isInViewport()) {
      this.scrollTargetRef.current?.scrollIntoView({behavior: behavior, block: "center", inline: "nearest"});
    }
    this.setState({highlighted: true})
    setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
      this.setState({highlighted: false})
    }, HIGHLIGHT_DURATION*1000);
  }

  toggleCollapse = () => {
    this.setState({collapsed: !this.state.collapsed});
  }

  handleExpand = async (event) => {
    const { markAsRead, scrollOnExpand } = this.props
    event.stopPropagation()
    if (this.isTruncated() || this.isSingleLine()) {
      markAsRead && await markAsRead()
      this.setState({truncated: false, singleLine: false, truncatedStateSet: true});
      if (scrollOnExpand) {
        this.scrollIntoView("auto") // should scroll instantly
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!shallowEqual(this.state, nextState))
      return true;
    if (!shallowEqualExcept(this.props, nextProps, ["updateComment", "post", "children"]))
      return true;
    if (this.commentTreesDiffer(this.props.children, nextProps.children))
      return true;

    return false;
  }

  commentTreesDiffer(oldComments, newComments) {
    if(!oldComments && newComments) return true;
    if(oldComments && !newComments) return true;
    if(!newComments) return false;

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

  isTruncated = () => {
    const { expandAllThreads, startThreadTruncated } = this.props;
    // const { truncatedStateSet } = this.state

    const truncatedStateUnset = !this.state || !this.state.truncatedStateSet
    
    return !expandAllThreads && (this.state?.truncated || ((this.props.truncated && truncatedStateUnset) || (startThreadTruncated && truncatedStateUnset)))
  }

  isNewComment = () => {
    const { comment, highlightDate } = this.props;
    return !!(highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()))
  }

  isSingleLine = () => {
    const { forceSingleLine, postPage, currentUser } = this.props
    const { singleLine } = this.state
    if (!singleLine || currentUser?.noSingleLineComments) return false;
    if (forceSingleLine)
      return true;
    
    // highlighted new comments on post page should always be expanded (and it needs to live here instead of "beginSingleLine" since the highlight status can change after the fact)
    const postPageAndNew = this.isNewComment() && postPage 

    return this.isTruncated() && !postPageAndNew
  }

  render() {
    const { comment, children, nestingLevel=1, highlightDate, updateComment, post,
      muiTheme, postPage, classes, child, showPostTitle, unreadComments,
      parentAnswerId, condensed, markAsRead, lastCommentId, hideReadComments,
      loadChildrenSeparately, shortform, refetch, parentCommentId, showExtraChildrenButton, noHash, scrollOnExpand } = this.props;

    const { SingleLineComment, CommentsItem, RepliesToCommentList } = Components

    if (!comment || !post)
      return null;

    const { collapsed, highlighted } = this.state

    const newComment = this.isNewComment()

    const hiddenReadComment = hideReadComments && !newComment

    const updatedNestingLevel = nestingLevel + (!!comment.gapIndicator ? 1 : 0)

    const nodeClass = classNames(
      "comments-node",
      classes.node,
      {
        "af":comment.af,
        "comments-node-root" : updatedNestingLevel === 1,
        "comments-node-even" : updatedNestingLevel % 2 === 0,
        "comments-node-odd"  : updatedNestingLevel % 2 !== 0,
        [classes.highlightAnimation] : highlighted,
        "comments-node-its-getting-nested-here": updatedNestingLevel > 8,
        "comments-node-so-take-off-all-your-margins": updatedNestingLevel > 12,
        "comments-node-im-getting-so-nested": updatedNestingLevel > 16,
        "comments-node-im-gonna-drop-my-margins": updatedNestingLevel > 20,
        "comments-node-what-are-you-even-arguing-about": updatedNestingLevel > 24,
        "comments-node-are-you-sure-this-is-a-good-idea": updatedNestingLevel > 28,
        "comments-node-seriously-what-the-fuck": updatedNestingLevel > 32,
        "comments-node-are-you-curi-and-lumifer-specifically": updatedNestingLevel > 36,
        "comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho": updatedNestingLevel > 40,
        [classes.child]: child && (!hideReadComments || comment.children?.length),
        [classes.new]: newComment,
        [classes.deleted]: comment.deleted,
        [classes.isAnswer]: comment.answer,
        [classes.answerChildComment]: parentAnswerId,
        [classes.childAnswerComment]: child && parentAnswerId,
        [classes.oddAnswerComment]: (updatedNestingLevel % 2 !== 0) && parentAnswerId,
        [classes.answerLeafComment]: !(children && children.length),
        [classes.isSingleLine]: this.isSingleLine(),
        [classes.commentHidden]: hiddenReadComment,
        [classes.shortformTop]: postPage && shortform && (updatedNestingLevel===1),
      }
    )

    const passedThroughItemProps = { post, postPage, comment, updateComment, showPostTitle, collapsed, refetch }
    const passedThroughNodeProps = { post, postPage, unreadComments, lastCommentId, markAsRead, muiTheme, highlightDate, updateComment, condensed, hideReadComments, refetch, scrollOnExpand }

    return (
        <div className={comment.gapIndicator && classes.gapIndicator}>
          <div className={nodeClass}
            onClick={(event) => this.handleExpand(event)}
            id={!noHash ? comment._id : undefined}
          >
            {!hiddenReadComment && comment._id && <div ref={this.scrollTargetRef}>
              {this.isSingleLine()
                ? <SingleLineComment
                    comment={comment} nestingLevel={updatedNestingLevel}
                    parentCommentId={parentCommentId}
                  />
                : <CommentsItem
                    truncated={this.isTruncated()}
                    nestingLevel={updatedNestingLevel}
                    parentCommentId={parentCommentId}
                    parentAnswerId={parentAnswerId || (comment.answer && comment._id)}
                    toggleCollapse={this.toggleCollapse}
                    key={comment._id}
                    scrollIntoView={this.scrollIntoView}
                    { ...passedThroughItemProps}
                  />
              }
            </div>}
            
            {!collapsed && children && children.length>0 && <div className={classes.children}>
              <div className={classes.parentScroll} onClick={this.scrollIntoView}/>
              { showExtraChildrenButton }
              {children && children.map(child =>
                <Components.CommentsNode child
                  comment={child.item}
                  parentCommentId={comment._id}
                  parentAnswerId={parentAnswerId || (comment.answer && comment._id)}
                  nestingLevel={updatedNestingLevel+1}
                  truncated={this.isTruncated()}
                  //eslint-disable-next-line react/no-children-prop
                  children={child.children}
                  key={child.item._id}
                  { ...passedThroughNodeProps}
                />)}
            </div>}
            
            {!this.isSingleLine() && loadChildrenSeparately &&
              <div className="comments-children">
                <div className={classes.parentScroll} onClick={this.scrollIntoView}/>
                <RepliesToCommentList
                  terms={{
                    view: "repliesToCommentThread",
                    topLevelCommentId: comment._id,
                    limit: 500
                  }}
                  parentCommentId={comment._id}
                  post={post}
                />
              </div>
            }
          </div>
        </div>
    )
  }
}

CommentsNode.propTypes = {
  comment: PropTypes.object.isRequired, // the current comment
};

registerComponent('CommentsNode', CommentsNode,
  withUser,
  withLocation,
  withErrorBoundary,
  withStyles(styles, { name: "CommentsNode" })
);
