import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withLocation } from '../../lib/routeUtil';
import React, { Component } from 'react';
import classNames from 'classnames';
import withErrorBoundary from '../common/withErrorBoundary';
import withUser from '../common/withUser';
import { shallowEqual, shallowEqualExcept } from '../../lib/utils/componentUtils';
import { AnalyticsContext } from "../../lib/analyticsEvents"
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';

const KARMA_COLLAPSE_THRESHOLD = -4;
const HIGHLIGHT_DURATION = 3

const styles = (theme: ThemeType): JssStyles => ({
  node: {
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    cursor: "default",
    // Higher specificity to override child class (variant syntax)
    '&$deleted': {
      opacity: 0.6
    }
  },
  commentsNodeRoot: {
    borderRadius: 3,
  },
  child: {
    marginLeft: theme.spacing.unit,
    marginBottom: 6,
    borderLeft: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderTop: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderBottom: `solid 1px ${theme.palette.commentBorderGrey}`,
    borderRight: "none",
    borderRadius: "2px 0 0 2px"
  },
  new: {
    '&&': {
      borderLeft: `solid 5px ${theme.palette.secondary.light}`,
      '&:hover': {
        borderLeft: `solid 5px ${theme.palette.secondary.main}`
      },
    }
  },
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
    border: `solid 2px ${theme.palette.commentBorderGrey}`,
  },
  answerChildComment: {
    marginBottom: theme.spacing.unit,
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
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
    borderTop: `solid 1px ${theme.palette.commentBorderGrey}`,
    '&.comments-node-root':{
      marginBottom: 4,
      borderBottom: `solid 1px ${theme.palette.commentBorderGrey}`,
    }
  },
  condensed: {
    '&.comments-node-root':{
      marginBottom: 4,
    }
  },
  shortformTop: {
    '&&': {
      marginTop: theme.spacing.unit*4,
      marginBottom: 0
    }
  },
  hoverPreview: {
    marginBottom: 0
  },
  moderatorHat: {
    "&.comments-node-even": {
      background: "#5f9b651c",
    },
    "&.comments-node-odd": {
      background: "#5f9b651c",
    },
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
    animation: `higlight-animation ${HIGHLIGHT_DURATION}s ease-in-out 0s;`
  },
  gapIndicator: {
    border: `solid 1px ${theme.palette.commentBorderGrey}`,
    backgroundColor: theme.palette.grey[100],
    marginLeft: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
  },
  promoted: {
    border: `solid 1px ${theme.palette.lwTertiary.main}`,
  }
})

type ExternalProps = {
  treeOptions: CommentTreeOptions,
  comment: CommentsList & {gapIndicator?: boolean},
  startThreadTruncated?: boolean,
  truncated?: boolean,
  shortform?: any,
  nestingLevel?: number,
  expandAllThreads?:boolean,
  expandByDefault?: boolean, // this determines whether this specific comment is expanded, without passing that expanded state to child comments
  child?: any,
  showPostTitle?: boolean,
  parentAnswerId?: string|null,
  parentCommentId?: string,
  showExtraChildrenButton?: any,
  noHash?: boolean,
  hoverPreview?: boolean,
  forceSingleLine?: boolean,
  forceNotSingleLine?: boolean,
  childComments?: Array<CommentTreeNode<CommentsList>>,
  hideReply?: boolean,
  loadChildrenSeparately?: boolean,
}

type CommentsNodeProps = ExternalProps & WithUserProps & WithStylesProps & WithLocationProps;

interface CommentsNodeState {
  collapsed: boolean,
  truncated: boolean,
  singleLine: boolean,
  truncatedStateSet: boolean,
  highlighted: boolean,
}

class CommentsNode extends Component<CommentsNodeProps,CommentsNodeState> {
  scrollTargetRef: any
  
  constructor(props: CommentsNodeProps) {
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

  beginCollapsed = (): boolean => {
    const { comment } = this.props
    return (
      comment.deleted ||
      comment.baseScore < KARMA_COLLAPSE_THRESHOLD
    )
  }

  beginTruncated = (): boolean => {
    return !!this.props.startThreadTruncated
  }

  beginSingleLine = (): boolean => {
    const { treeOptions, comment, forceSingleLine, shortform, nestingLevel, forceNotSingleLine } = this.props
    const { lastCommentId, condensed, postPage } = treeOptions;
    const mostRecent = lastCommentId === comment._id
    const lowKarmaOrCondensed = (comment.baseScore < 10 || !!condensed)
    const shortformAndTop = (nestingLevel === 1) && shortform
    const postPageAndTop = (nestingLevel === 1) && postPage

    if (forceSingleLine)
      return true;

    return (
      this.isTruncated() &&
      lowKarmaOrCondensed &&
      !(mostRecent && condensed) &&
      !shortformAndTop &&
      !postPageAndTop &&
      !forceNotSingleLine
    )
  }

  componentDidMount() {
    const { comment, location } = this.props
    const { postPage, post } = this.props.treeOptions;
    let commentHash = location.hash;
    if (comment && commentHash === ("#" + comment._id) && post && postPage) {
      setTimeout(() => { //setTimeout make sure we execute this after the element has properly rendered
        this.scrollIntoView()
      }, 0);
    }
  }

  isInViewport(): boolean {
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

  handleExpand = async (event: React.MouseEvent) => {
    const { markAsRead, scrollOnExpand } = this.props.treeOptions
    event.stopPropagation()
    if (this.isTruncated() || this.isSingleLine()) {
      markAsRead && await markAsRead()
      this.setState({truncated: false, singleLine: false, truncatedStateSet: true});
      if (scrollOnExpand) {
        this.scrollIntoView("auto") // should scroll instantly
      }
    }
  }

  shouldComponentUpdate(nextProps: CommentsNodeProps, nextState: CommentsNodeState) {
    if (!shallowEqual(this.state, nextState))
      return true;
    if (!shallowEqualExcept(this.props, nextProps, ["post", "childComments"]))
      return true;
    if (this.commentTreesDiffer(this.props.childComments, nextProps.childComments))
      return true;

    return false;
  }

  commentTreesDiffer(oldComments: CommentTreeNode<CommentsList>[]|null|undefined, newComments: CommentTreeNode<CommentsList>[]|null|undefined) {
    if(!oldComments && newComments) return true;
    if(oldComments && !newComments) return true;
    if(!newComments || !oldComments) return false;

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

  isTruncated = (): boolean => {
    const { expandAllThreads, startThreadTruncated, truncated } = this.props;
    // const { truncatedStateSet } = this.state

    const truncatedStateUnset = !this.state || !this.state.truncatedStateSet

    return !expandAllThreads && (this.state?.truncated || ((!!truncated && truncatedStateUnset) || (!!startThreadTruncated && truncatedStateUnset)))
  }

  isNewComment = (): boolean => {
    const { comment, treeOptions } = this.props;
    const { highlightDate } = treeOptions;
    return !!(highlightDate && (new Date(comment.postedAt).getTime() > new Date(highlightDate).getTime()))
  }

  isSingleLine = (): boolean => {
    const { forceSingleLine, forceNotSingleLine, currentUser } = this.props
    const { singleLine } = this.state

    if (!singleLine || currentUser?.noSingleLineComments) return false;
    if (forceSingleLine) return true;
    if (forceNotSingleLine) return false

    return this.isTruncated() && !this.isNewComment()
  }

  render() {
    const {
      treeOptions, comment, childComments, nestingLevel=1,
      classes, child, showPostTitle,
      parentAnswerId, loadChildrenSeparately, shortform, parentCommentId,
      showExtraChildrenButton, noHash, hoverPreview, hideReply, expandByDefault,
    } = this.props;
    const { postPage, highlightDate, condensed, post } = treeOptions;

    const { SingleLineComment, CommentsItem, RepliesToCommentList, AnalyticsTracker } = Components

    if (!comment)
      return null;

    const { collapsed, highlighted } = this.state

    const newComment = this.isNewComment()

    const updatedNestingLevel = nestingLevel + (!!comment.gapIndicator ? 1 : 0)

    const nodeClass = classNames(
      "comments-node",
      classes.node,
      {
        "af":comment.af,
        [classes.commentsNodeRoot] : updatedNestingLevel === 1,
        "comments-node-root" : updatedNestingLevel === 1,
        "comments-node-even" : updatedNestingLevel % 2 === 0,
        "comments-node-odd"  : updatedNestingLevel % 2 !== 0,
        [classes.highlightAnimation]: highlighted,
        "comments-node-its-getting-nested-here": updatedNestingLevel > 8,
        "comments-node-so-take-off-all-your-margins": updatedNestingLevel > 12,
        "comments-node-im-getting-so-nested": updatedNestingLevel > 16,
        "comments-node-im-gonna-drop-my-margins": updatedNestingLevel > 20,
        "comments-node-what-are-you-even-arguing-about": updatedNestingLevel > 24,
        "comments-node-are-you-sure-this-is-a-good-idea": updatedNestingLevel > 28,
        "comments-node-seriously-what-the-fuck": updatedNestingLevel > 32,
        "comments-node-are-you-curi-and-lumifer-specifically": updatedNestingLevel > 36,
        "comments-node-cuz-i-guess-that-makes-sense-but-like-really-tho": updatedNestingLevel > 40,
        [classes.child]: child,
        [classes.new]: newComment,
        [classes.deleted]: comment.deleted,
        [classes.isAnswer]: comment.answer,
        [classes.answerChildComment]: parentAnswerId,
        [classes.childAnswerComment]: child && parentAnswerId,
        [classes.oddAnswerComment]: (updatedNestingLevel % 2 !== 0) && parentAnswerId,
        [classes.answerLeafComment]: !(childComments && childComments.length),
        [classes.isSingleLine]: this.isSingleLine(),
        [classes.condensed]: condensed,
        [classes.shortformTop]: postPage && shortform && (updatedNestingLevel===1),
        [classes.hoverPreview]: hoverPreview,
        [classes.moderatorHat]: comment.moderatorHat,
        [classes.promoted]: comment.promoted
      }
    )

    const passedThroughItemProps = { comment, showPostTitle, collapsed, hideReply }

    return (
        <div className={comment.gapIndicator && classes.gapIndicator}>
          <div className={nodeClass}
            onClick={(event) => this.handleExpand(event)}
            id={!noHash ? comment._id : undefined}
          >
            {comment._id && <div ref={this.scrollTargetRef}>
              {this.isSingleLine()
                ? <AnalyticsContext singleLineComment commentId={comment._id}>
                    <AnalyticsTracker eventType="singeLineComment">
                      <SingleLineComment
                        treeOptions={treeOptions}
                        comment={comment}
                        nestingLevel={updatedNestingLevel}
                        parentCommentId={parentCommentId}
                        hideKarma={post?.hideCommentKarma}
                      />
                    </AnalyticsTracker>
                  </AnalyticsContext>
                : <CommentsItem
                    treeOptions={treeOptions}
                    truncated={this.isTruncated() && !expandByDefault} // expandByDefault checked separately here, so isTruncated can also be passed to child nodes
                    nestingLevel={updatedNestingLevel}
                    parentCommentId={parentCommentId}
                    parentAnswerId={parentAnswerId || (comment.answer && comment._id) || undefined}
                    toggleCollapse={this.toggleCollapse}
                    key={comment._id}
                    scrollIntoView={this.scrollIntoView}
                    { ...passedThroughItemProps}
                  />
              }
            </div>}

            {!collapsed && childComments && childComments.length>0 && <div className={classes.children}>
              <div className={classes.parentScroll} onClick={() => this.scrollIntoView}/>
              { showExtraChildrenButton }
              {childComments.map(child =>
                <Components.CommentsNode child
                  treeOptions={treeOptions}
                  comment={child.item}
                  parentCommentId={comment._id}
                  parentAnswerId={parentAnswerId || (comment.answer && comment._id) || null}
                  nestingLevel={updatedNestingLevel+1}
                  truncated={this.isTruncated()}
                  childComments={child.children}
                  key={child.item._id}
                />)}
            </div>}

            {!this.isSingleLine() && loadChildrenSeparately &&
              <div className="comments-children">
                <div className={classes.parentScroll} onClick={() => this.scrollIntoView}/>
                <RepliesToCommentList
                  terms={{
                    view: "repliesToCommentThread",
                    topLevelCommentId: comment._id,
                    limit: 500
                  }}
                  parentCommentId={comment._id}
                  post={post as PostsBase}
                />
              </div>
            }
          </div>
        </div>
    )
  }
}

const CommentsNodeComponent = registerComponent<ExternalProps>('CommentsNode', CommentsNode, {
  styles,
  hocs: [withUser, withLocation, withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsNode: typeof CommentsNodeComponent,
  }
}

