import React from 'react';
import LibrarySequenceCard from './LibrarySequenceCard';
import LoadMore from "../common/LoadMore";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const SequencesPageFragmentMultiQuery = gql(`
  query multiSequenceLibrarySequencesGridQuery($selector: SequenceSelector, $limit: Int, $enableTotal: Boolean) {
    sequences(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SequencesPageFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('LibrarySequencesGrid', (theme: ThemeType) => ({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    },
    [theme.breakpoints.down('xs')]: {
      gridTemplateColumns: "minmax(0, 1fr)",
    },
    "& a:hover, & a:active": {
      textDecoration: "none",
      color: theme.palette.link.unmarked,
    },
  },
  loadMore: {
    marginTop: 12,
  },
  noResults: {
    color: theme.palette.text.dim4,
    ...theme.typography.italic,
  },
}));

const LibrarySequencesGrid = ({terms, itemsPerPage=12, showLoadMore=false, showAuthor=true}: {
  terms: SequencesViewTerms,
  itemsPerPage?: number,
  showLoadMore?: boolean,
  showAuthor?: boolean,
}) => {
  const classes = useStyles(styles);
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(SequencesPageFragmentMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 12,
      enableTotal: showLoadMore,
    },
    itemsPerPage,
  });

  const results = data?.sequences?.results;

  if (!results?.length) {
    return loading
      ? <Loading/>
      : <Typography variant="body2" className={classes.noResults}>
          No sequences to display.
        </Typography>;
  }

  return <div>
    <div className={classes.grid}>
      {results.map(sequence =>
        <LibrarySequenceCard key={sequence._id} sequence={sequence} showAuthor={showAuthor}/>
      )}
    </div>
    {showLoadMore && <div className={classes.loadMore}>
      <LoadMore {...loadMoreProps}/>
    </div>}
  </div>;
};

export default LibrarySequencesGrid;
