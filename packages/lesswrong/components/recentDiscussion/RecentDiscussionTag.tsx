import React, {useState, useCallback} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { unflattenComments, CommentTreeNode } from '../../lib/utils/unflatten';
import withErrorBoundary from '../common/withErrorBoundary'
import { tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import { truncate } from '../../lib/editor/ellipsize';
import type { CommentTreeOptions } from '../comments/commentTree';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { TagCommentType } from '../../lib/collections/comments/types';
import { useOrderPreservingArray } from '../hooks/useOrderPreservingArray';
import { preferredHeadingCase } from '../../themes/forumTheme';
import CommentsNodeInner from "../comments/CommentsNode";
import ContentItemBody from "../common/ContentItemBody";
import ContentStyles from "../common/ContentStyles";

const styles = (theme: ThemeType) => ({
  root: {
    marginBottom: theme.spacing.unit*4,
    position: "relative",
    minHeight: 58,
    boxShadow: theme.palette.boxShadow.default,
    borderRadius: 3,
    backgroundColor: theme.palette.panelBackground.recentDiscussionThread,
  },
  title: {
    ...theme.typography.display2,
    ...theme.typography.commentStyle,
    ...theme.typography.smallCaps,
    marginTop: 0,
    marginBottom: 8,
    display: "block",
    fontSize: "1.75rem",
  },
  tag: {
    paddingTop: 18,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 12,
    background: theme.palette.panelBackground.default,
    borderRadius: 3,
    marginBottom: 4,

    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      paddingLeft: 14,
      paddingRight: 14,
    },
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
    color: theme.palette.text.dim3,
    ...theme.typography.commentStyle,
  },
});

const RecentDiscussionTag = ({ tag, refetch = () => {}, comments, expandAllThreads: initialExpandAllThreads, tagCommentType = "DISCUSSION", classes }: {
  tag: TagRecentDiscussion,
  refetch?: any,
  comments: Array<CommentsList>,
  expandAllThreads?: boolean
  tagCommentType?: TagCommentType,
  classes: ClassesType<typeof styles>
}) => {
  const [truncated, setTruncated] = useState(true);
  const [expandAllThreads, setExpandAllThreads] = useState(false);
  
  const lastCommentId = comments && comments[0]?._id
  const nestedComments = useOrderPreservingArray(unflattenComments(comments), (comment) => comment.item._id);
  
  const clickExpandDescription = useCallback(() => {
    setTruncated(false);
    setExpandAllThreads(true);
  }, []);
  
  const descriptionHtml = tag.description?.html;
  const readMore = `<a>(${preferredHeadingCase("Read More")})</a>`;
  const maybeTruncatedDescriptionHtml = truncated
    ? truncate(descriptionHtml, tag.descriptionTruncationCount || 2, "paragraphs", readMore)
    : descriptionHtml;
  
  const commentTreeOptions: CommentTreeOptions = {
    refetch,
    scrollOnExpand: true,
    lastCommentId: lastCommentId,
    highlightDate: tag.lastVisitedAt ?? undefined,
    tag: tag,
    condensed: true,
  }
  
  const metadataWording = tag.wikiOnly ? "Wiki page" : `${taggingNameCapitalSetting.get()} page - ${tag.postCount} posts`;
  
  return <div className={classes.root}>
    <div className={classes.tag}>
      <Link to={tagGetDiscussionUrl(tag)} className={classes.title}>
        {tag.name}
      </Link>
      
      <div className={classes.metadata}>
        <span>{metadataWording}</span>
      </div>
      
      <div onClick={clickExpandDescription}>
        <ContentStyles contentType="comment">
          <ContentItemBody
            dangerouslySetInnerHTML={{__html: maybeTruncatedDescriptionHtml||""}}
            description={`tag ${tag.name}`}
          />
        </ContentStyles>
      </div>
    </div>
    
    {nestedComments.length ? <div className={classes.content}>
      <div className={classes.commentsList}>
        {nestedComments.map((comment: CommentTreeNode<CommentsList>) =>
          <div key={comment.item._id}>
            <CommentsNodeInner
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

export default registerComponent(
  'RecentDiscussionTag', RecentDiscussionTag, {
    styles,
    hocs: [withErrorBoundary],
  }
);


