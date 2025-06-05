import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import classNames from 'classnames';

// Share styles with SequencesGrid
import SequencesGrid, { styles } from './SequencesGrid';
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SequencesPageFragmentMultiQuery = gql(`
  query multiSequenceSequencesGridWrapperQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequencesPageFragment
      }
      totalCount
    }
  }
`);

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
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(SequencesPageFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: showLoadMore,
    },
    itemsPerPage,
  });

  const results = data?.sequences?.results;
  
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

export default registerComponent('SequencesGridWrapper', SequencesGridWrapper, {
  styles,
  areEqual: {
    terms: "deep"
  }
});



