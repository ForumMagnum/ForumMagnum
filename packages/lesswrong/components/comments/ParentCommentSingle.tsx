import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import classNames from 'classnames';

const ParentCommentSingle = ({ documentId, nestingLevel, post, tag, rootCommentApproval, truncated }: {
  documentId: string,
  nestingLevel: number,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  rootCommentApproval?: CommentApprovalWithoutComment,
  truncated?: boolean,
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
          "comments-node-odd"  : nestingLevel % 2 != 0,
        }
      )}>
        <Components.CommentsItem
          treeOptions={{tag, post, rootCommentApproval}}
          isParentComment
          comment={document}
          nestingLevel={nestingLevel}
          truncated={!!truncated}
        />
      </div>
    )
  } else {
    return <Components.Loading />
  }
}

const ParentCommentSingleComponent = registerComponent('ParentCommentSingle', ParentCommentSingle, {});

declare global {
  interface ComponentTypes {
    ParentCommentSingle: typeof ParentCommentSingleComponent,
  }
}

