import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import classNames from 'classnames';

// Share styles with SequencesGrid
import { styles } from './SequencesGrid';
import { Typography } from "@/components/common/Typography";
import { Loading } from "@/components/vulcan-core/Loading";
import LoadMore from "@/components/common/LoadMore";
import SequencesGrid from "@/components/sequences/SequencesGrid";

const SequencesGridWrapper = ({
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
      <SequencesGrid sequences={results} showAuthor={showAuthor} />
      {showLoadMore && <LoadMore {...loadMoreProps} />}
    </div>);
  } else if (loading) {
    return (<div className={classNames(className, classes.grid)}>
      <Loading/>
    </div>);
  } else {
    return (<div className={classNames(className, classes.grid)}>
      <div className={classes.gridContent}>
        <Typography variant="body2" className={classes.noResults}>
          No sequences to display.
        </Typography>
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

export default SequencesGridWrapperComponent;

