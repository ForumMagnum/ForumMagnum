import React, { useState, useCallback } from 'react';
import {
  Components,
  registerComponent,
} from '../../lib/vulcan-lib';

import classNames from 'classnames';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import withRecordPostView from '../common/withRecordPostView';

import { postExcerptFromHTML } from '../../lib/editor/ellipsize'
import { postHighlightStyles } from '../../themes/stylePiping'

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 50,
  },
  postStyle: theme.typography.postStyle,
  postBody: {
    ...postHighlightStyles(theme),
    marginBottom:theme.spacing.unit*2,
    maxWidth: "100%",
    overflowX: "auto",
    overflowY: "hidden",
  },
  postItem: {
    // position: "absolute",
    // right: "100%",
    paddingBottom:10,
    ...theme.typography.postStyle,
    // width: 300,
    // marginTop: -2,
    // textAlign: "right",
    // marginRight: -theme.spacing.unit
  },
  continueReading: {
    marginTop:theme.spacing.unit*2,
    marginBottom:theme.spacing.unit*2,
  },
  postHighlight: {
    ...postHighlightStyles(theme),
    marginTop:5,
    maxWidth:600,
    marginBottom:16,
    maxHeight: 1000,
    overflow: "hidden",
    '& a, & a:hover, & a:focus, & a:active, & a:visited': {
      backgroundColor: "none"
    }
  },
  noComments: {
    // borderBottom: "solid 1px rgba(0,0,0,.2)"
  },
  threadMeta: {
    cursor: "pointer",

    "&:hover $showHighlight": {
      opacity: 1
    },
  },
  showHighlight: {
    opacity: 0,
  },
  content :{
    [theme.breakpoints.up('md')]: {
      marginLeft: theme.spacing.unit*3,
    }
  },
  commentsList: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  }
})

interface ExternalProps {
  post: PostsRecentDiscussion,
  comments: Array<CommentsList>,
  refetch: any,
  expandAllThreads?: boolean,
}
interface RecentDiscussionThreadProps extends ExternalProps, WithUpdateCommentProps, WithStylesProps {
  isRead: any,
  recordPostView: any,
}
const RecentDiscussionThread = ({
  post, recordPostView,
  comments, updateComment, classes, isRead, refetch,
  expandAllThreads: initialExpandAllThreads,
}: RecentDiscussionThreadProps) => {
  const [highlightVisible, setHighlightVisible] = useState(false);
  const [readStatus, setReadStatus] = useState(false);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [showSnippet] = useState(!isRead || post.commentCount === null); // This state should never change after mount, so we don't grab the setter from useState
  
  const markAsRead = useCallback(
    () => {
      setReadStatus(true);
      setMarkedAsVisitedAt(new Date());
      setExpandAllThreads(true);
      recordPostView({post, extraEventProperties: {type: "recentDiscussionClick"}})
    },
    [setReadStatus, setMarkedAsVisitedAt, setExpandAllThreads, recordPostView, post]
  );
  const showHighlight = useCallback(
    () => {
      setHighlightVisible(!highlightVisible);
      markAsRead();
    },
    [setHighlightVisible, highlightVisible, markAsRead]
  );
  
  const { ContentItemBody, PostsItemMeta, ShowOrHideHighlightButton, CommentsNode, PostsHighlight, PostsTitle } = Components

  const lastCommentId = comments && comments[0]?._id
  const nestedComments = unflattenComments(comments);

  const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

  if (comments && !comments.length && post.commentCount != null) {
    // New posts should render (to display their highlight).
    // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
    return null
  }

  const highlightClasses = classNames({
    [classes.noComments]: post.commentCount === null
  })
  return (
    <div className={classes.root}>
      <div>
        <div className={classes.postItem}>
          <PostsTitle wrap post={post}/>
          <div className={classes.threadMeta} onClick={showHighlight}>
            <PostsItemMeta post={post}/>
            <ShowOrHideHighlightButton
              className={classes.showHighlight}
              open={highlightVisible}/>
          </div>
        </div>
        { highlightVisible ?
          <div className={highlightClasses}>
            <PostsHighlight post={post} />
          </div>
          : <div className={highlightClasses} onClick={showHighlight}>
              { showSnippet &&
                <ContentItemBody
                  className={classes.postHighlight}
                  dangerouslySetInnerHTML={{__html: postExcerptFromHTML(post.contents && post.contents.htmlHighlight)}}
                  description={`post ${post._id}`}
                />
              }
            </div>
        }
      </div>
      <div className={classes.content}>
        <div className={classes.commentsList}>
          {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
            <div key={comment.item._id}>
              <CommentsNode
                startThreadTruncated={true}
                expandAllThreads={initialExpandAllThreads || expandAllThreads}
                scrollOnExpand
                nestingLevel={1}
                lastCommentId={lastCommentId}
                comment={comment.item}
                markAsRead={markAsRead}
                highlightDate={lastVisitedAt}
                //eslint-disable-next-line react/no-children-prop
                children={comment.children}
                key={comment.item._id}
                post={post}
                refetch={refetch}
                condensed
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

/*class RecentDiscussionThread extends PureComponent {
  state = { highlightVisible: false, readStatus: false, markedAsVisitedAt: null, expandAllThreads: false }

  showHighlight = () => {
    this.setState(prevState => ({highlightVisible:!prevState.highlightVisible}));
    this.markAsRead()
  }

  markAsRead = async () => {
    this.setState({readStatus:true, markedAsVisitedAt: new Date(), expandAllThreads: true});
    this.props.recordPostView({post:this.props.post})
  }

  render() {
    const { post, comments, updateComment, currentUser, classes, isRead, refetch } = this.props
    const { readStatus, showHighlight, markedAsVisitedAt, showSnippet } = this.state
    const { ContentItemBody, PostsItemMeta, ShowOrHideHighlightButton, CommentsNode, PostsHighlight, PostsTitle } = Components

    const lastCommentId = comments && comments[0]?._id
    const nestedComments = unflattenComments(comments);

    const lastVisitedAt = markedAsVisitedAt || post.lastVisitedAt

    if (comments && !comments.length && post.commentCount != null) {
      // New posts should render (to display their highlight).
      // Posts with at least one comment should only render if that those comments meet the frontpage filter requirements
      return null
    }

    const highlightClasses = classNames({
      [classes.noComments]: post.commentCount === null
    })

    return (
      <div className={classes.root}>
        <div className={(currentUser && !(isRead || readStatus)) ? classes.unreadPost : null}>
          <div className={classes.postItem}>
            <PostsTitle wrap post={post} tooltip={false} read={userHasBoldPostItems(currentUser)}/>
            <div className={classes.threadMeta} onClick={this.showHighlight}>
              <PostsItemMeta post={post}/>
              <ShowOrHideHighlightButton
                className={classes.showHighlight}
                open={highlightVisible}/>
            </div>
          </div>
          { highlightVisible ?
            <div className={highlightClasses}>
              <PostsHighlight post={post} />
            </div>
            : <div className={highlightClasses} onClick={this.showHighlight}>
                { showSnippet &&
                  <ContentItemBody
                    className={classes.postHighlight}
                    dangerouslySetInnerHTML={{__html: postExcerptFromHTML(post.contents && post.contents.htmlHighlight)}}
                    description={`post ${post._id}`}
                  />
                }
              </div>
          }
        </div>
        <div className={classes.content}>
          <div className={classes.commentsList}>
            {nestedComments.map(comment =>
              <div key={comment.item._id}>
                <CommentsNode
                  startThreadTruncated={true}
                  expandAllThreads={this.props.expandAllThreads || this.state.expandAllThreads}
                  scrollOnExpand
                  nestingLevel={1}
                  lastCommentId={lastCommentId}
                  currentUser={currentUser}
                  comment={comment.item}
                  markAsRead={this.markAsRead}
                  highlightDate={lastVisitedAt}
                  //eslint-disable-next-line react/no-children-prop
                  children={comment.children}
                  key={comment.item._id}
                  updateComment={updateComment}
                  post={post}
                  refetch={refetch}
                  condensed
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}*/

const RecentDiscussionThreadComponent = registerComponent<ExternalProps>(
  'RecentDiscussionThread', RecentDiscussionThread, {
    styles,
    hocs: [
      withRecordPostView,
      withErrorBoundary
    ]
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionThread: typeof RecentDiscussionThreadComponent,
  }
}

