import React, { useState, useMemo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
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
import { WikiTagMockup, WikiTagNode } from './types'; // Adjust the import path as needed
import { wikitagMockupData } from './wikitag_mockup_data';

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    // padding: "0 100px",
    maxWidth: 1100,
    // margin: "0 auto",
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
      paddingRight: 40, // Make room for the reset button
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
    // overflow: 'hidden',
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
    // fontFamily: theme.palette.fonts.serifStack,
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
    //don't wrap
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
}))

// Helper function to generate baseScore
function generateBaseScore(description_length: number, postCount: number): number {
  const baseComponent = Math.sqrt((description_length / 100)); // + (postCount / 2));
  const random = Math.pow(Math.abs(Math.sin(description_length * 0.1 + postCount * 0.3)), 2) * 8;
  return Math.round(baseComponent + random);
}

// Define the buildTree function here
function buildTree(
  items: Omit<WikiTagMockup, 'baseScore'>[], 
  _id: string | null = null, 
  depth = 0, 
  seen: Set<string> = new Set()
): WikiTagNode[] {
  if (depth > 5) {
    console.warn('Maximum depth exceeded in buildTree');
    return [];
  }

  const filteredItems = items.filter(item => item.parentTagId === _id);
  
  // Add baseScore to all items first
  const itemsWithScore = filteredItems.map(item => ({
    ...item,
    baseScore: generateBaseScore(item.description_length, item.postCount)
  }));

  // Sort items by baseScore before processing
  const sortedItems = itemsWithScore.sort((a, b) => b.baseScore - a.baseScore);

  return sortedItems.flatMap(item => {
    if (seen.has(item._id)) {
      console.warn(`Circular reference detected for item ${item._id}`);
      return [];
    }

    seen.add(item._id);

    if (depth === 1) {
      return buildTree(items, item._id, depth + 1, new Set(seen));
    } else {
      const children = buildTree(items, item._id, depth + 1, new Set(seen))
        .sort((a, b) => b.baseScore - a.baseScore); // Sort children by baseScore
      return [{ ...item, children }];
    }
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

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();

  const { SectionButton, SectionTitle, WikiTagNestedList } = Components;
  const [selectedWikiTag, setSelectedWikiTag] = useState<WikiTagMockup | null>(null);
  const [pinnedWikiTag, setPinnedWikiTag] = useState<WikiTagMockup | null>(null);

  const { query } = useLocation();

  const isArbitalRedirect = query.ref === 'arbital';
  console.log('isArbitalRedirect', isArbitalRedirect);

  const { LWTooltip } = Components;

  // State variable for the current search query
  const [currentQuery, setCurrentQuery] = useState('');

  // Function to handle search state changes
  const handleSearchStateChange = (searchState: any): void => {
    setCurrentQuery(searchState.query);
  };

  const handleHover = (wikitag: WikiTagMockup | null) => {
    if (!pinnedWikiTag && wikitag && (wikitag.description_length > 0 || wikitag.postCount > 0)) {
      setSelectedWikiTag(wikitag);
    }
  };

  const handleClick = (wikitag: WikiTagMockup) => {
    if (pinnedWikiTag && pinnedWikiTag._id === wikitag._id) {
      setPinnedWikiTag(null);
      setSelectedWikiTag(null);
    } else if (wikitag.description_length > 0 || wikitag.postCount > 0) {
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

  // Remove leading and trailing `"` and \n from the html
  const cleanedHtml = selectedWikiTag?.description_html?.replace(/^"|"$/g, '').replace(/\\n/g, '') ?? '';

  const prioritySlugs = useMemo(() => [
    'rationality', 'ai', 'world-modeling', 
    'world-optimization', 'practical', 'community', 'site-meta'
  ] as const, []);

  // Create the artificial "Uncategorized" tags
  const uncategorizedRootTag: Omit<WikiTagMockup, 'baseScore'> = {
    _id: 'uncategorized-root',
    name: 'Uncategorized',
    slug: 'uncategorized-root',
    description_length: 0,
    description_html: '',
    postCount: 0,
    parentTagId: null,
  };

  const uncategorizedChildTag: Omit<WikiTagMockup, 'baseScore'> = {
    _id: 'uncategorized-child',
    name: 'Uncategorized',
    slug: 'uncategorized',
    description_length: 0,
    description_html: '',
    postCount: 0,
    parentTagId: 'uncategorized-root',
  };

  // Adjust items to assign unparented tags (excluding priority tags) to the "Uncategorized" child
  const adjustedItems = wikitagMockupData.map(item => {
    if (!item.parentTagId) {
      if (prioritySlugs.includes(item.slug as typeof prioritySlugs[number])) {
        // Keep priority tags at root level
        return item;
      } else {
        // Assign non-priority unparented tags to 'uncategorized-child'
        return {
          ...item,
          parentTagId: 'uncategorized-child',
        };
      }
    }
    return item;
  });

  // Add the artificial "Uncategorized" tags to the items list
  const itemsWithUncategorized = [
    ...adjustedItems,
    uncategorizedRootTag,
    uncategorizedChildTag,
  ];

  // Move the tree-building and sorting logic here
  const sortedTree = useMemo(() => {
    const tree = buildTree(itemsWithUncategorized as Omit<WikiTagMockup, 'baseScore'>[], null, 0);

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
  }, [prioritySlugs]);

  // Component to access search results
  const CustomStateResults = connectStateResults(({ searchResults }) => {
    const hits = (searchResults && searchResults.hits) || [];
    const tagIds = hits.map(hit => hit.objectID);

    // First filter by priority slugs at the root level
    const priorityFilteredTree = sortedTree.filter(wikitag => 
      prioritySlugs.includes(wikitag.slug as typeof prioritySlugs[number]) || wikitag.slug === 'uncategorized-root'
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
