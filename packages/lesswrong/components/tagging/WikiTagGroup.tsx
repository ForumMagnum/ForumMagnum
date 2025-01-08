import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, gql, NetworkStatus } from '@apollo/client';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useWindowSize } from '../hooks/useScreenWidth';
import classNames from 'classnames';
import { queryIsUpdating } from '../common/queryStatusUtils';


const CONCEPT_ITEM_WIDTH = 300;
const MAX_ITEMS_PER_COLUMN = 10;

const styles = defineStyles("WikiTagGroup", (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  titleItem: {
  },
  showMoreChildren: {
    fontSize: 12,
    fontWeight: 400,
    // TODO: put this into a theme
    color: "#426c46",
    marginBottom: 8,
    marginTop: 2,
    marginLeft: 16,
    width: "100%",
  },
  column: {
    display: "flex",
    flexDirection: "column",
    width: CONCEPT_ITEM_WIDTH,
    flex: "0 0 auto",
  },
  children: {
    // TODO: come back to this and figure out a better way to handle it, especially for multiple screen widths
    width: "min(950px, 100vw - 16px)",
  },
  childrenContainer: {
    width: "100%",
    position: "relative",
  },
  childrenList: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    rowGap: "16px",
  },
  childrenListWrapped: {
    flexWrap: "wrap",
  },
  loadMore: {
    marginTop: 4,
    fontSize: "1.1rem",
  },
  loadMoreLoading: {
    marginTop: 12,
    marginLeft: "unset !important",
    textAlign: "left !important",
  },
}));


const WikiTagGroup = ({
  parentTag,
  searchTagIds,
  initialLimit = 3 * MAX_ITEMS_PER_COLUMN,
  showArbitalIcons = false,
}: {
  parentTag: ConceptItemFragment
  searchTagIds: string[] | null;
  initialLimit?: number;
  showArbitalIcons?: boolean;
}) => {
  const classes = useStyles(styles);
  const [limit, setLimit] = useState(initialLimit);

  const parentTagId = parentTag._id === 'uncategorized-root' ? null : parentTag._id;

  const { data, loading, fetchMore, networkStatus } = useQuery(gql`
    query GetTagsByParentId(
      $parentTagId: String,
      $limit: Int,
      $searchTagIds: [String]
    ) {
      TagsByParentId(
        parentTagId: $parentTagId,
        limit: $limit,
        searchTagIds: $searchTagIds
      ) {
        tags {
          ...ConceptItemFragment
        }
        totalCount
      }
    }
    ${fragmentTextForQuery('ConceptItemFragment')}
  `, {
    ssr: true,
    fetchPolicy: 'cache-and-network',
    nextFetchPolicy: 'cache-only',
    // nextFetchPolicy: 'cache-only',
    variables: {
      parentTagId,
      limit: initialLimit,
      searchTagIds,
    },
    notifyOnNetworkStatusChange: true,
  });

  const pages = data?.TagsByParentId?.tags ?? [];
  const totalCount = data?.TagsByParentId?.totalCount ?? 0;

  // Helper function to split items into columns with a maximum number of items per column
  function splitItemsIntoColumns<T>(items: T[], itemsPerColumn: number): T[][] {
    const columns: T[][] = [];
    for (let i = 0; i < items.length; i += itemsPerColumn) {
      columns.push(items.slice(i, i + itemsPerColumn));
    }
    return columns;
  }

  // Split pages into columns with MAX_ITEMS_PER_COLUMN items each
  const columns: ConceptItemFragment[][] = splitItemsIntoColumns(pages, MAX_ITEMS_PER_COLUMN);

  const loadMore = () => {
      const newLimit = limit * 2;
      void fetchMore({
        variables: {
          parentTagId,
          limit: newLimit,
          searchTagIds,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return fetchMoreResult
        }
      })
      setLimit(newLimit);
    };
  //   [maxInitialShow, limit, fetchMore, parentTagId, searchTagIds]
  // );


  const { LoadMore, ConceptItem, Loading } = Components;


  if (searchTagIds && pages.length === 0) {
    return null;
  }


  const showLoadingSpinner = loading && (pages.length === 0) && (networkStatus !== NetworkStatus.fetchMore);

  return (
    <div className={classes.root}>
      <div className={classes.titleItem}>
        <ConceptItem
          wikitag={parentTag}
          nestingLevel={0}
          showArbitalIcon={showArbitalIcons}
        />
      </div>
      {showLoadingSpinner && <Loading />}
      {pages.length > 0 && <div className={classes.children}>
        <div className={classes.childrenContainer}>
          <div className={classNames(classes.childrenList)}>
            {columns.map((columnItems, columnIndex) => (
              <div key={columnIndex} className={classes.column}>
                {columnItems.map((childPage, idx) => (
                  <ConceptItem
                    key={childPage._id}
                    wikitag={childPage}
                    nestingLevel={1}
                    index={idx}
                    showArbitalIcon={showArbitalIcons}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>}
      {pages.length < totalCount && (
        <LoadMore
          loading={networkStatus===3}
          loadMore={loadMore}
          count={pages.length}
          totalCount={totalCount}
          className={classes.loadMore}
          loadingClassName={classes.loadMoreLoading}
        />
      )}
    </div>
  );
};


const WikiTagGroupComponent = registerComponent("WikiTagGroup", WikiTagGroup);

declare global {
  interface ComponentTypes {
    WikiTagGroup: typeof WikiTagGroupComponent
  }
}
export default WikiTagGroupComponent;

