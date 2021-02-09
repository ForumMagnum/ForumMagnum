import React, {useState, useCallback} from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { truncate } from '../../lib/editor/ellipsize';
import { commentBodyStyles } from '../../themes/stylePiping'
import { useRecordTagView } from '../common/withRecordPostView';
import type { CommentTreeOptions } from '../comments/commentTree';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.boxShadow,
    borderRadius: 3,
    backgroundColor: "rgba(253,253,253)",
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.commentStyle,
    fontVariant: "small-caps",
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  tag: {
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
    background: "white",
    borderRadius: 3,
    marginBottom:4
  },
  tagDescription: {
    ...commentBodyStyles(theme),
  },
  content: {
    marginLeft: 4,
    marginRight: 4,
    paddingBottom: 1
  },
  commentsList: {
    marginTop: 12,
    marginLeft: 12,
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0
    }
  },
  metadata: {
    fontSize: "1.1rem",
    color: theme.palette.grey[600],
    ...theme.typography.commentStyle,
  },
});

const RecentDiscussionTag = ({ tag, comments, expandAllThreads: initialExpandAllThreads, classes }: {
  tag: TagRecentDiscussion,
  comments: Array<CommentsList>,
  expandAllThreads?: boolean
  classes: ClassesType
}) => {
  const { CommentsNode, ContentItemBody } = Components;
  const [truncated, setTruncated] = useState(true);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  const [readStatus, setReadStatus] = useState(false);
  const {recordTagView} = useRecordTagView(tag);
  const [markedAsVisitedAt, setMarkedAsVisitedAt] = useState<Date|null>(null);
  
  const lastVisitedAt = markedAsVisitedAt || tag.lastVisitedAt
  const lastCommentId = comments && comments[0]?._id
  const nestedComments = unflattenComments(comments);
  
  const markAsRead = useCallback(
    () => {
      setReadStatus(true);
      setMarkedAsVisitedAt(new Date());
      setExpandAllThreads(true);
      recordTagView({tag, extraEventProperties: {type: "recentDiscussionTagClick"}})
    },
    [setReadStatus, setMarkedAsVisitedAt, setExpandAllThreads, recordTagView, tag]
  );
  const clickExpandDescription = useCallback(() => {
    setTruncated(false);
    setExpandAllThreads(true);
  }, []);
  
  const descriptionHtml = tag.description?.html;
  const maybeTruncatedDescriptionHtml = truncated
    ? truncate(descriptionHtml, tag.descriptionTruncationCount || 2, "paragraphs", "<a>(Read More)</a>")
    : descriptionHtml;
  
  const commentTreeOptions: CommentTreeOptions = {
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    markAsRead: markAsRead,
    highlightDate: lastVisitedAt,
    tag: tag,
    condensed: true,
  }
  
  return <div className={classes.root}>
    <div className={classes.tag}>
      <Link to={tagGetDiscussionUrl(tag)} className={classes.title}>
        {tag.name}
      </Link>
      
      <div className={classes.metadata}>
        {tag.wikiOnly
          ? <span>Wiki page</span>
          : <span>Tag page - {tag.postCount} posts</span>
        }
      </div>
      
      <div onClick={clickExpandDescription} className={classes.tagDescription}>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: maybeTruncatedDescriptionHtml||""}}
          description={`tag ${tag.name}`}
          className={classes.description}
        />
      </div>
    </div>
    
    {nestedComments.length ? <div className={classes.content}>
      <div className={classes.commentsList}>
        {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
          <div key={comment.item._id}>
            <CommentsNode
              treeOptions={commentTreeOptions}
              startThreadTruncated={true}
              expandAllThreads={initialExpandAllThreads || expandAllThreads}
              nestingLevel={1}
              comment={comment.item}
              childComments={comment.children}
              key={comment.item._id}
            />
          </div>
        )}
      </div>
    </div> : null}
  </div>
}

const RecentDiscussionTagComponent = registerComponent(
  'RecentDiscussionTag', RecentDiscussionTag, {
    styles,
    hocs: [withErrorBoundary],
  }
);

declare global {
  interface ComponentTypes {
    RecentDiscussionTag: typeof RecentDiscussionTagComponent,
  }
}
