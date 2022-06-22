import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const LargeSequencesItemList = ({classes, terms, itemsPerPage=10, showLoadMore=true, showAuthor=true}: {
  terms: SequencesViewTerms,
  className?: string,
  classes: ClassesType,
  itemsPerPage?: number,
  showLoadMore?: boolean,
  showAuthor?: boolean,
}) => {
  const { LargeSequencesItem, LoadMore } = Components

  const { results: sequences, loading, loadMoreProps } = useMulti({
    terms,
    itemsPerPage,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
    enableTotal: showLoadMore,
  });
  
  return <div className={classes.root}>
    {sequences?.map(sequence => <LargeSequencesItem key={sequence._id} sequence={sequence}/>)}
    <LoadMore {...loadMoreProps}/>
  </div>;
}

const LargeSequencesItemListComponent = registerComponent('LargeSequencesItemList', LargeSequencesItemList, {styles});

declare global {
  interface ComponentTypes {
    LargeSequencesItemList: typeof LargeSequencesItemListComponent
  }
}

