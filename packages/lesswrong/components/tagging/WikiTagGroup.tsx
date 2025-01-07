import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { Components, fragmentTextForQuery, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useWindowSize } from '../hooks/useScreenWidth';
import classNames from 'classnames';


const CONCEPT_ITEM_WIDTH = 300;
const MAX_ITEMS_PER_COLUMN = 12;
const COLUMN_GAP = 8;

const styles = defineStyles("WikiTagGroup", (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  titleItem: {
    // marginBottom: 8,
  },
  // childrenList: {
  //   display: "flex",
  //   flexDirection: "column",
  //   width: "100%",
  // },
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
  },
}));

const GET_TAGS_BY_PARENT_ID = gql`
  query GetTagsByParentId(
    $parentTagId: String,
    $limit: Int,
    $offset: Int,
    $searchTagIds: [String]
  ) {
    TagsByParentId(
      parentTagId: $parentTagId,
      limit: $limit,
      offset: $offset,
      searchTagIds: $searchTagIds
    ) {
      tags {
        ...AllTagsPageCacheFragment
      }
      totalCount
    }
  }
  ${fragmentTextForQuery('AllTagsPageCacheFragment')}
`;

const WikiTagGroup = ({
  parentTag,
  searchTagIds,
  maxInitialShow = 3*MAX_ITEMS_PER_COLUMN,
  showArbitalIcons = false,
}: {
  parentTag: AllTagsPageCacheFragment | Omit<AllTagsPageCacheFragment, "_id">;
  searchTagIds: string[] | null;
  maxInitialShow?: number;
  showArbitalIcons?: boolean;
}) => {
  const classes = useStyles(styles);
  const [limit, setLimit] = useState(maxInitialShow);

  const parentTagId = '_id' in parentTag ? parentTag._id : null;
  
  const { data, loading } = useQuery(GET_TAGS_BY_PARENT_ID, {
    variables: {
      parentTagId,
      limit,
      offset: 0,
      searchTagIds,
    },
    fetchPolicy: 'cache-and-network',
  });

  const pages = useMemo(() => data?.TagsByParentId?.tags ?? [], [data]);
  const totalCount = useMemo(() => data?.TagsByParentId?.totalCount ?? 0, [data]);

  // Calculate the number of visible columns based on window size
  const windowSize = useWindowSize();
  const calculateVisibleColumns = () => {
    const availableWidth = windowSize.width - 32;
    const columnsWithGaps = Math.floor(availableWidth / (CONCEPT_ITEM_WIDTH + COLUMN_GAP));
    // Ensure at least 1 column is shown
    return Math.max(1, columnsWithGaps);
  };
  const visibleColumns = calculateVisibleColumns();

  // Helper function to split items into columns with a maximum number of items per column
  function splitItemsIntoColumns<T>(items: T[], itemsPerColumn: number): T[][] {
    const columns: T[][] = [];
    for (let i = 0; i < items.length; i += itemsPerColumn) {
      columns.push(items.slice(i, i + itemsPerColumn));
    }
    return columns;
  }

  // Split pages into columns with MAX_ITEMS_PER_COLUMN items each
  const columns: AllTagsPageCacheFragment[][] = splitItemsIntoColumns(pages, MAX_ITEMS_PER_COLUMN);

  const loadMore = useCallback(() => {
    setLimit((currentLimit) => currentLimit + maxInitialShow);
  }, [maxInitialShow]);

  // If we're searching and this group has no matches, don't render
  if (searchTagIds && pages.length === 0) {
    return null;
  }

  const { LoadMore, ConceptItem, Loading } = Components;

  if (loading) {
    return <Loading />;
  }

  if (!loading && !pages) {
    return null;
  }

  return (
    <div className={classes.root}>
      <div className={classes.titleItem}>
        <ConceptItem
          wikitag={parentTag}
          nestingLevel={0}
          showArbitalIcon={showArbitalIcons}
        />
      </div>

      <div className={classes.children}>
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
      </div>

      {pages.length < totalCount && (
        <LoadMore
          loading={loading}
          loadMore={loadMore}
          count={pages.length}
          totalCount={totalCount}
          className={classes.loadMore}
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

