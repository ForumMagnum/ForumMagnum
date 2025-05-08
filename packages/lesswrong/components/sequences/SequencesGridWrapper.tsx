import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import classNames from 'classnames';

// Share styles with SequencesGrid
import { styles } from './SequencesGrid';

const SequencesGridWrapperInner = ({
  terms,
  className,
  classes,
  itemsPerPage=10,
  showLoadMore = false,
  showAuthor = false,
}: {
  terms: SequencesViewTerms,
  className?: string,
  classes: ClassesType<typeof styles>,
  itemsPerPage?: number,
  showLoadMore?: boolean,
  showAuthor?: boolean,
}) => {
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    itemsPerPage,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
    enableTotal: showLoadMore,
  });
  
  if (results && results.length) {
    return (<div className={className}>
      <Components.SequencesGrid sequences={results} showAuthor={showAuthor} />
      {showLoadMore && <Components.LoadMore {...loadMoreProps} />}
    </div>);
  } else if (loading) {
    return (<div className={classNames(className, classes.grid)}>
      <Components.Loading/>
    </div>);
  } else {
    return (<div className={classNames(className, classes.grid)}>
      <div className={classes.gridContent}>
        <Components.Typography variant="body2" className={classes.noResults}>
          No sequences to display.
        </Components.Typography>
      </div>
    </div>);
  }
};

export const SequencesGridWrapper = registerComponent('SequencesGridWrapper', SequencesGridWrapperInner, {
  styles,
  areEqual: {
    terms: "deep"
  }
});

declare global {
  interface ComponentTypes {
    SequencesGridWrapper: typeof SequencesGridWrapper
  }
}

