import React, {useState} from 'react';
import { Components, registerComponent, } from '../../lib/vulcan-lib';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { Tags } from '../../lib/collections/tags/collection';
import { Link } from '../../lib/reactRouterWrapper';
import { truncate } from '../../lib/editor/ellipsize';
import { commentBodyStyles } from '../../themes/stylePiping'

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
    ...theme.typography.postStyle,
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
});

const RecentDiscussionTag = ({ tag, comments, expandAllThreads, classes }: {
  tag: TagRecentDiscussion,
  comments: Array<CommentsList>,
  expandAllThreads?: boolean
  classes: ClassesType
}) => {
  const { CommentsNode, ContentItemBody } = Components;
  const [truncated, setTruncated] = useState(true);
  
  const lastCommentId = comments && comments[0]?._id
  const nestedComments = unflattenComments(comments);
  
  const clickExpandDescription = () => {
    setTruncated(false);
  };
  
  const descriptionHtml = tag.description?.html;
  const maybeTruncatedDescriptionHtml = truncated
    ? truncate(descriptionHtml, tag.descriptionTruncationCount || 2, "paragraphs", "<a>(Read More)</a>")
    : descriptionHtml;
  
  return <div className={classes.root}>
    <div className={classes.tag}>
      <Link to={Tags.getDiscussionUrl(tag)} className={classes.title}>
        {tag.name}
      </Link>
      
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
              startThreadTruncated={true}
              //expandAllThreads={initialExpandAllThreads || expandAllThreads}
              scrollOnExpand
              nestingLevel={1}
              lastCommentId={lastCommentId}
              comment={comment.item}
              //markAsRead={markAsRead}
              //highlightDate={lastVisitedAt}
              //eslint-disable-next-line react/no-children-prop
              children={comment.children}
              key={comment.item._id}
              tag={tag}
              //refetch={refetch}
              condensed
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
