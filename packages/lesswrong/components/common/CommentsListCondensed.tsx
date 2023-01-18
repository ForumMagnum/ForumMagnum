import React, { useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { forumTypeSetting } from '../../lib/instanceSettings';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { ContentTypeString } from '../posts/PostsPage/ContentType';
import { useCurrentUser } from './withUser';

const isEAForum = forumTypeSetting.get() === 'EAForum';

const styles = (theme: ThemeType): JssStyles => ({
  subheader: {
    '& svg': {
      color: theme.palette.grey[600],
    },
    marginTop: -4,
    marginBottom: 2,
  },
});

const CommentsListCondensed = ({label, contentType, terms, initialLimit, itemsPerPage, showTotal=false, classes}: {
  label: string,
  contentType: ContentTypeString,
  terms: CommentsViewTerms
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  classes: ClassesType,
}) => {
  const { Loading, ContentType, CommentsNode, LoadMore } = Components;
  const { results, loading, count, totalCount, loadMoreProps } = useMulti({
    terms: terms,
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'CommentWithRepliesFragment',
  });

  if (loading && !results?.length) {
    return <Loading/>;
  }
  if (!results?.length) {
    return null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)
  return <>
    <ContentType type={contentType} label={label} className={classes.subheader} />
    {results.map((comment) => {
      return <CommentsNode
        treeOptions={{
          // F7U12
          tag: comment.tag ?? undefined,
          forceSingleLine: true
        }}
        comment={comment}
        key={comment._id}
        loadChildrenSeparately
        displayTagIcon
      />
    })}
    {loading && <Loading/>}
    {showLoadMore && <LoadMore {...{
      ...loadMoreProps,
      totalCount: showTotal ? totalCount : undefined,
    }} />}
  </>;
}

const CommentsListCondensedComponent = registerComponent(
  'CommentsListCondensed',
  CommentsListCondensed,
  {styles}
);

declare global {
  interface ComponentTypes {
    CommentsListCondensed: typeof CommentsListCondensedComponent
  }
}
