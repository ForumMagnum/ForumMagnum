import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import type { CommentTreeOptions } from './commentTree';
import React from 'react';
import classNames from 'classnames';
import CommentsItem, { commentsItemStyles } from "./CommentsItem/CommentsItem";
import Loading from "../vulcan-core/Loading";
import { useStyles } from '../hooks/useStyles';
import { commentFrameStyles } from './CommentFrame';

const ParentCommentSingle = ({
  documentId,
  nestingLevel,
  post,
  tag,
  truncated,
  treeOptions,
}: {
  documentId: string,
  nestingLevel: number,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  truncated?: boolean,
  treeOptions?: CommentTreeOptions
}) => {
  const frameClasses = useStyles(commentFrameStyles);
  const commentItemClasses = useStyles(commentsItemStyles);

  const { document, loading } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
  });
  if (document && !loading) {
    return (
      <div className={classNames(
        frameClasses.node2,
        commentItemClasses.root2,
        {
          [frameClasses.commentsNodeRoot] : nestingLevel === 1,
          [frameClasses.even]: nestingLevel % 2 === 0,
          [frameClasses.odd]: nestingLevel % 2 !== 0,
        }
      )}>
        <CommentsItem
          treeOptions={{...treeOptions, tag, post}}
          isParentComment
          comment={document}
          nestingLevel={nestingLevel}
          truncated={!!truncated}
        />
      </div>
    )
  } else {
    return <Loading />
  }
}

export default registerComponent('ParentCommentSingle', ParentCommentSingle, {});



