import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import classNames from 'classnames';

// Share styles with SequencesGrid
import { styles } from './SequencesGrid';

const SequencesGridWrapper = ({
  terms,
  className,
  classes,
  showLoadMore = false,
  showAuthor = false,
}: {
  terms: SequencesViewTerms,
  className?: string,
  classes: ClassesType,
  showLoadMore?: boolean,
  showAuthor?: boolean,
}) => {
  const { results, loading, count, totalCount, loadMore, loadingMore } = useMulti({
    terms,
    collectionName: "Sequences",
    fragmentName: 'SequencesPageFragment',
    enableTotal: true,
  });
  
  if (results && results.length) {
    return (<div className={classNames(className, classes.gridWrapper)}>
      <Components.SequencesGrid sequences={results} showAuthor={showAuthor} />
      { showLoadMore && totalCount! > count! &&
          <Components.LoadMore loading={loadingMore} loadMore={loadMore} count={count} totalCount={totalCount} />
      }
    </div>);
  } else if (loading) {
    return (<div className={classNames(className, classes.grid)}>
      <Components.Loading/>
    </div>);
  } else {
    // TODO: Replace with SequencesNoResults
    return (<div className={classNames(className, classes.grid)}>
      <div className={classes.gridContent}>
        <Components.PostsNoResults/>
      </div>
    </div>);
  }
};

const SequencesGridWrapperComponent = registerComponent('SequencesGridWrapper', SequencesGridWrapper, {
  styles,
  areEqual: {
    terms: "deep"
  }
});

declare global {
  interface ComponentTypes {
    SequencesGridWrapper: typeof SequencesGridWrapperComponent
  }
}

