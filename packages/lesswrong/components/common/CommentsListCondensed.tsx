import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const styles = (_: ThemeType): JssStyles => ({
  subheader: {
    fontSize: 14,
  },
});

const CommentsListCondensed = ({label, terms, initialLimit, itemsPerPage, showTotal=false, hideTag, classes}: {
  label: string,
  terms: CommentsViewTerms
  initialLimit?: number,
  itemsPerPage?: number,
  showTotal?: boolean,
  hideTag?: boolean,
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, ShortformListItem, LoadMore } = Components;
  const { results, loading, count, totalCount, loadMoreProps } = useMulti({
    terms: terms,
    limit: initialLimit,
    itemsPerPage,
    enableTotal: true,
    collectionName: "Comments",
    fragmentName: 'ShortformComments',
  });

  if (loading && !results?.length) {
    return <Loading/>;
  }
  if (!results?.length) {
    return null;
  }

  const showLoadMore = !loading && (count === undefined || totalCount === undefined || count < totalCount)
  return <>
    <SectionTitle title={label} className={classes.subheader} />
    {results.map((comment) => {
      return <ShortformListItem
        comment={comment}
        key={comment._id}
        hideTag={hideTag}
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
  {styles, stylePriority: 1},
);

declare global {
  interface ComponentTypes {
    CommentsListCondensed: typeof CommentsListCondensedComponent
  }
}
