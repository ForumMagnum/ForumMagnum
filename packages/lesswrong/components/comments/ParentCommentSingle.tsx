import { registerComponent } from '../../lib/vulcan-lib/components';
import type { CommentTreeOptions } from './commentTree';
import React from 'react';
import classNames from 'classnames';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";
import CommentsItem from "./CommentsItem/CommentsItem";
import Loading from "../vulcan-core/Loading";

const CommentsListWithParentMetadataQuery = gql(`
  query ParentCommentSingle($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

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
  const { loading, data } = useQuery(CommentsListWithParentMetadataQuery, {
    variables: { documentId: documentId },
  });
  const document = data?.comment?.result;
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

export default registerComponent('ParentCommentSingle', ParentCommentSingle, {});



