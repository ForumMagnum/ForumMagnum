import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import type { CommentTreeOptions } from './commentTree';
import React from 'react';
import classNames from 'classnames';
import { Loading } from "@/components/vulcan-core/Loading";
import CommentsItem from "@/components/comments/CommentsItem/CommentsItem";

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
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
  });
  if (document && !loading) {
    return (
      <div className={classNames(
        'comments-node',
        'recent-comments-node',
        {
          "comments-node-root" : nestingLevel === 1,
          "comments-node-even" : nestingLevel % 2 === 0,
          "comments-node-odd"  : nestingLevel % 2 !== 0,
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

const ParentCommentSingleComponent = registerComponent('ParentCommentSingle', ParentCommentSingle, {});

declare global {
  interface ComponentTypes {
    ParentCommentSingle: typeof ParentCommentSingleComponent,
  }
}

export default ParentCommentSingleComponent;

