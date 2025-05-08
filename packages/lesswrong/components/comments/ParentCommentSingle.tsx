import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import type { CommentTreeOptions } from './commentTree';
import React from 'react';
import classNames from 'classnames';
import { CommentsItem } from "./CommentsItem/CommentsItem";
import { Loading } from "../vulcan-core/Loading";

const ParentCommentSingleInner = ({
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

export const ParentCommentSingle = registerComponent('ParentCommentSingle', ParentCommentSingleInner, {});

declare global {
  interface ComponentTypes {
    ParentCommentSingle: typeof ParentCommentSingle,
  }
}

