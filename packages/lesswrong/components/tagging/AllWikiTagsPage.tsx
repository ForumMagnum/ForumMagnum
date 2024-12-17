import React, { useState, useMemo } from 'react';
import { registerComponent, Components, fragmentTextForQuery } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useDialog } from '../common/withDialog';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SearchIcon from '@material-ui/icons/Search';
import { InstantSearch } from '../../lib/utils/componentsWithChildren';
import { SearchBox, connectStateResults } from 'react-instantsearch-dom';
import { getSearchIndexName, getSearchClient, isSearchEnabled } from '../../lib/search/searchUtil';

// Import the mock data and types
import { WikiTagNode } from './types'; // Adjust the import path as needed
import { gql, useQuery } from '@apollo/client';

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    maxWidth: 1100,
    marginLeft: 100,
    position: 'relative',
  },
  topSection: {
    marginBottom: 20,
    display: "flex",
    flexDirection: "column",
    gap: "32px",
  },
  mainRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "32px",
    width: "100%",
  },
  titleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  addTagSection: {
    position: 'absolute',
    top: 78,
    right: 20,
  },
  addTagButton: {
    marginBottom: -10,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: 4,
    }
  },
  titleClass: {
    fontSize: "4rem",
    fontWeight: 300,
    marginBottom: 0,
  },
  searchContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    height: "100%",
    maxWidth: 600,
    position: "relative",
  },
  searchInputArea: {
    display: "block",
    position: "relative",
    width: "100%",
    height: 48,
    marginBottom: 24,

    "& .ais-SearchBox": {
      display: 'inline-block',
      position: 'relative',
      width: '100%',
      height: 46,
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      fontSize: 14,
    },
    "& .ais-SearchBox-form": {
      height: '100%'
    },
    "& .ais-SearchBox-submit": {
      display: "none"
    },
    "& .ais-SearchBox-reset": {
      position: "absolute",
      top: "50%",
      right: 12,
      transform: "translateY(-50%)",
      border: "none",
      background: "none",
      cursor: "pointer",
      opacity: 0.8,
      padding: 4,
      "&:hover": {
        color: theme.palette.grey[700]
      }
    },
    "& .ais-SearchBox-input": {
      height: "100%",
      width: "100%",
      padding: "12px 48px",
      paddingRight: 40,
      verticalAlign: "bottom",
      borderStyle: "none",
      boxShadow: "none",
      backgroundColor: "white",
      fontSize: '1.4rem',
      "-webkit-appearance": "none",
      cursor: "text",
      borderRadius: 12,
    },
  },
  searchIcon: {
    color: theme.palette.grey[500],
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  mainContent: {
    display: "flex",
    gap: "32px",
    flexGrow: 1,
    width: "100%",
  },
  wikiTagNestedList: {
    flexShrink: 0,
    width: "100%",
    marginLeft: 0,
    maxWidth: 600,
    alignSelf: "flex-start",
  },
  wikitagName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    marginBottom: 16,
  },
  viewer: {
    flexShrink: 0,
    width: '100%',
    maxWidth: 600,
    padding: "24px 42px",
    backgroundColor: "white",
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 80,
    height: '100vh',
    overflowY: 'auto',
  },
  viewerContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  wikitagDescription: {
    fontSize: "1rem",
    fontWeight: 400,
    flexGrow: 1,
    overflowY: 'auto',
  },
  wikitagHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pinMessage: {
    color: theme.palette.grey[700],
    fontSize: '1.2rem',
    fontStyle: 'italic',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
}))

// Helper function to generate baseScore
function generateBaseScore(description_length: number, postCount: number): number {
  const baseComponent = Math.sqrt((description_length / 100)); // + (postCount / 2));
  const random = Math.pow(Math.abs(Math.sin((description_length * 0.1) + (postCount * 0.3))), 2) * 8;
  return Math.round(baseComponent + random);
}


// Create the artificial "Uncategorized" tags
const uncategorizedRootTag = {
  _id: 'uncategorized-root',
  name: 'Uncategorized',
  slug: 'uncategorized-root',
  description: {
    _id: 'uncategorized-root',
    html: '',
  },
  postCount: 0,
  coreTagId: null,
  parentTagId: null,
};

const uncategorizedChildTag = {
  _id: 'uncategorized-child',
  name: 'Uncategorized',
  slug: 'uncategorized',
  description: {
    _id: 'uncategorized-child',
    html: '',
  },
  postCount: 0,
  coreTagId: 'uncategorized-root',
  parentTagId: 'uncategorized-root',
};

const prioritySlugs = [
  'rationality', 'ai', 'world-modeling', 
  'world-optimization', 'practical', 'community', 'site-meta'
] as const;

const priorityTagIds = [
  'Ng8Gice9KNkncxqcj',
  'sYm3HiWcfZvrGu3ui',
  '3uE2pXvbcnS9nnZRE',
  'xexCWMyds6QLWognu',
  'fkABsGCJZ6y9qConW',
  'izp6eeJJEg9v5zcur',
  'MfpEPj6kJneT9gWT6',
] as const;

// Define the buildTree function here
function buildTree(
  items: (AllTagsPageCacheFragment & { parentTagId: string | null })[],
  _id: string | null = null, 
  depth = 0, 
  seen: Set<string> = new Set()
): WikiTagNode[] {
  if (depth > 5) {
    // eslint-disable-next-line no-console
    console.warn('Maximum depth exceeded in buildTree');
    return [];
  }

  const filteredItems = items.filter(item => item.parentTagId === _id);
  
  // Add baseScore to all items first
  const itemsWithScore = filteredItems.map(item => ({
    ...item,
    baseScore: generateBaseScore(item.description?.html?.length ?? 0, item.postCount)
  }));

  // Sort items by baseScore before processing
  const sortedItems = itemsWithScore.sort((a, b) => b.baseScore - a.baseScore);

  return sortedItems.flatMap(item => {
    if (seen.has(item._id)) {
      // eslint-disable-next-line no-console
      console.warn(`Circular reference detected for item ${item.name} (${item._id})`);
      return [];
    }

    seen.add(item._id);

    const children = buildTree(items, item._id, depth + 1, new Set(seen)).sort((a, b) => b.baseScore - a.baseScore);

    return [{ ...item, children }];
  });
}

// Function to filter the tree based on tag IDs, but skip first level filtering
function filterTreeByTagIds(
  tree: WikiTagNode[], 
  tagIds: string[], 
  depth = 0
): WikiTagNode[] {
  return tree
    .map(node => {
      // At depth 0 (first level), don't filter out any nodes
      const hasHit = depth === 0 ? true : tagIds.includes(node._id);
      
      let children: WikiTagNode[] = [];
      if (node.children) {
        // Always pass depth + 1 to children
        children = filterTreeByTagIds(node.children, tagIds, depth + 1);
      }
      
      if (hasHit || children.length > 0) {
        return { ...node, children };
      }
      return null;
    })
    .filter(node => node !== null) as WikiTagNode[];
}

const allTagsQuery = gql`
  query AllTagsQuery {
    AllTags {
      ...AllTagsPageCacheFragment
    }
  }
  ${fragmentTextForQuery('AllTagsPageCacheFragment')}
`;

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();

  const { SectionButton, SectionTitle, WikiTagNestedList } = Components;
  const [selectedWikiTag, setSelectedWikiTag] = useState<WikiTagNode | null>(null);
  const [pinnedWikiTag, setPinnedWikiTag] = useState<WikiTagNode | null>(null);

  const { query } = useLocation();

  const { data } = useQuery(allTagsQuery, { ssr: true });

  const tags: AllTagsPageCacheFragment[] = data?.AllTags ?? [];

  const isArbitalRedirect = query.ref === 'arbital';

  const { LWTooltip } = Components;

  // State variable for the current search query
  const [currentQuery, setCurrentQuery] = useState('');

  // Function to handle search state changes
  const handleSearchStateChange = (searchState: any): void => {
    setCurrentQuery(searchState.query);
  };

  const handleHover = (wikitag: WikiTagNode | null) => {
    if (!pinnedWikiTag && wikitag && ((wikitag.description?.html?.length ?? 0) > 0 || wikitag.postCount > 0)) {
      setSelectedWikiTag(wikitag);
    }
  };

  const handleClick = (wikitag: WikiTagNode) => {
    if (pinnedWikiTag && pinnedWikiTag._id === wikitag._id) {
      setPinnedWikiTag(null);
      setSelectedWikiTag(null);
    } else if ((wikitag.description?.html?.length ?? 0) > 0 || wikitag.postCount > 0) {
      setPinnedWikiTag(wikitag);
      setSelectedWikiTag(wikitag);
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setPinnedWikiTag(null);
      setSelectedWikiTag(null);
    }
  };

  const adjustedItems = tags.map(tag => {
    if (priorityTagIds.includes(tag._id as typeof priorityTagIds[number])) {
      return {
        ...tag,
        parentTagId: null,
      };
    }

    return {
      ...tag,
      parentTagId: tag.coreTagId ? tag.coreTagId : 'uncategorized-child',
    };
  });

  // Add the artificial "Uncategorized" tags to the items list
  const itemsWithUncategorized = useMemo(() => [
    ...adjustedItems,
    uncategorizedRootTag,
    uncategorizedChildTag,
  ], [adjustedItems]);

  // Move the tree-building and sorting logic here
  const sortedTree = useMemo(() => {
    const tree = buildTree(itemsWithUncategorized, null, 0);

    return tree.sort((a, b) => {
      const indexA = prioritySlugs.indexOf(a.slug as typeof prioritySlugs[number]);
      const indexB = prioritySlugs.indexOf(b.slug as typeof prioritySlugs[number]);

      // If both items are in the priority list, sort by priority
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      // If only one item is in priority list, it goes first
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      // Ensure "Uncategorized" is placed at the end
      if (a.slug === 'uncategorized-root') return 1;
      if (b.slug === 'uncategorized-root') return -1;
      // For all other items, sort by baseScore
      return b.baseScore - a.baseScore;
    });
  }, [itemsWithUncategorized]);

  // Component to access search results
  const CustomStateResults = connectStateResults(({ searchResults }) => {
    const hits = (searchResults && searchResults.hits) || [];
    const tagIds = hits.map(hit => hit.objectID);

    // First filter by priority slugs at the root level
    const priorityFilteredTree = sortedTree.filter(wikitag => 
      priorityTagIds.includes(wikitag._id as typeof priorityTagIds[number]) || wikitag.slug === 'uncategorized-root'
    );

    // Then apply search filtering if there's a query
    const filteredTags = currentQuery 
      ? filterTreeByTagIds(priorityFilteredTree, tagIds, 0)
      : priorityFilteredTree;

    return (
      <div className={classes.wikiTagNestedList}>
        <WikiTagNestedList
          pages={filteredTags}
          onHover={handleHover}
          onClick={handleClick}
        />
      </div>
    );
  });

  return (
    <AnalyticsContext pageContext="allWikiTagsPage">
      <div>
        <div className={classes.addTagSection}>
          <SectionButton>
            {currentUser && tagUserHasSufficientKarma(currentUser, "new") && <LWTooltip title="A WikiTag is a combination of a wiki page and a tag. It has either a wiki entry, a list of posts with that tag, or both!">
              <Link
                to={tagCreateUrl}
                className={classes.addTagButton}
              >
                <AddBoxIcon/>
                New WikiTag
              </Link>
            </LWTooltip>}
            {!currentUser && <a 
              onClick={(ev) => {
                openDialog({
                  componentName: "LoginPopup",
                  componentProps: {}
                });
                ev.preventDefault();
              }}
              className={classes.addTagButton}
            >
              <AddBoxIcon/>
              New Wiki Page
            </a>}
          </SectionButton>
        </div>
        <div className={classes.root} onClick={handleBackgroundClick}>
          <div className={classes.topSection}>
            <div className={classes.titleSection}>
              <div className={classes.titleClass}>Concepts</div>
            </div>

            <div className={classes.searchContainer}>
              <InstantSearch
                indexName={getSearchIndexName('Tags')}
                searchClient={getSearchClient()}
                onSearchStateChange={handleSearchStateChange}
              >
                <div className={classes.searchInputArea}>
                  <SearchIcon className={classes.searchIcon} />
                  <SearchBox 
                    translations={{ placeholder: 'What would you like to read about?' }}
                  />
                </div>
                <CustomStateResults />
              </InstantSearch>
            </div>
          </div>
          <div className={classes.mainContent}>
          </div>
        </div>
      </div>
    </AnalyticsContext>
  );
};

const AllWikiTagsPageComponent = registerComponent("AllWikiTagsPage", AllWikiTagsPage);

export default AllWikiTagsPageComponent;

declare global {
  interface ComponentTypes {
    AllWikiTagsPage: typeof AllWikiTagsPageComponent
  }
}
