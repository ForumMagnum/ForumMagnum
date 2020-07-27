import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import { Comments } from '../../lib/collections/comments';
import classNames from 'classnames';

const ParentCommentSingle = ({ documentId, nestingLevel, post, tag, truncated }: {
  documentId: string,
  nestingLevel: number,
  post?: PostsMinimumInfo,
  tag?: TagBasicInfo,
  truncated?: boolean,
}) => {
  const { document, loading } = useSingle({
    documentId,
    collection: Comments,
    fragmentName: 'CommentsListWithPostMetadata',
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
        <Components.CommentsItem isParentComment comment={document} nestingLevel={nestingLevel} post={post} tag={tag} truncated={!!truncated}/>
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

