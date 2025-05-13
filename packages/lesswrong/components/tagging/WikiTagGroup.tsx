import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, gql, NetworkStatus } from '@apollo/client';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { AnalyticsContext } from '@/lib/analyticsEvents';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { fragmentTextForQuery } from "../../lib/vulcan-lib/fragments";
import LoadMore from "../common/LoadMore";
import ConceptItem from "./ConceptItem";
import Loading from "../vulcan-core/Loading";

// TODO: single source for here and ConceptItem, must be kept in sync
const CONCEPT_ITEM_WIDTH = 280;
const MAX_ITEMS_PER_COLUMN = 10;

const styles = defineStyles("WikiTagGroup", (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  titleItem: {
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
    columnGap: "24px",
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

function splitItemsIntoColumns<T>(items: T[], itemsPerColumn: number): T[][] {
  const columns: T[][] = [];
  for (let i = 0; i < items.length; i += itemsPerColumn) {
    columns.push(items.slice(i, i + itemsPerColumn));
  }
  return columns;
}

const WikiTagGroup = ({
  coreTag,
  searchTagIds,
  initialLimit = 3 * MAX_ITEMS_PER_COLUMN,
  showArbitalIcons = false,
  noLinkOrHoverOnTitle = false,
}: {
  coreTag: ConceptItemFragment
  searchTagIds: string[] | null;
  initialLimit?: number;
  showArbitalIcons?: boolean;
  noLinkOrHoverOnTitle?: boolean;
}) => {
  const classes = useStyles(styles);
  const [limit, setLimit] = useState(initialLimit);

  const coreTagId = coreTag._id === 'uncategorized-root' ? null : coreTag._id;

  const { data, loading, fetchMore, networkStatus } = useQuery(gql`
    query GetTagsByCoreTagId(
      $coreTagId: String,
      $limit: Int,
      $searchTagIds: [String]
    ) {
      TagsByCoreTagId(
        coreTagId: $coreTagId,
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
    variables: {
      coreTagId,
      limit: initialLimit,
      searchTagIds,
    },
    notifyOnNetworkStatusChange: true,
  });

  const pages = data?.TagsByCoreTagId?.tags ?? [];
  const totalCount = data?.TagsByCoreTagId?.totalCount ?? 0;

  // Split pages into columns with MAX_ITEMS_PER_COLUMN items each
  const columns: ConceptItemFragment[][] = splitItemsIntoColumns(pages, MAX_ITEMS_PER_COLUMN);

  const loadMore = () => {
    const newLimit = Math.min(limit * 2, limit + 300);
    void fetchMore({
      variables: {
        coreTagId,
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
  if (searchTagIds && pages.length === 0) {
    return null;
  }


  const showLoadingSpinner = loading && (pages.length === 0) && (networkStatus !== NetworkStatus.fetchMore);

  return (
    <AnalyticsContext pageSectionContext="wikiTagGroup" tagGroupName={coreTag.name}>
      <div className={classes.root}>
        <div className={classes.titleItem}>
          <ConceptItem
            wikitag={coreTag}
            isTitleItem
            showArbitalIcon={showArbitalIcons}
            noLinkOrHoverOnTitle={noLinkOrHoverOnTitle}
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
            loading={networkStatus === NetworkStatus.fetchMore}
            loadMore={loadMore}
            count={pages.length}
            totalCount={totalCount}
            className={classes.loadMore}
            loadingClassName={classes.loadMoreLoading}
          />
        )}
      </div>
    </AnalyticsContext>
  );
};


export default registerComponent("WikiTagGroup", WikiTagGroup);




