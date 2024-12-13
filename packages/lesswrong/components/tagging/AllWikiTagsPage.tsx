import React, { useState, useMemo } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import AddBoxIcon from '@material-ui/icons/AddBox';
import { useDialog } from '../common/withDialog';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { tagCreateUrl, tagUserHasSufficientKarma } from '../../lib/collections/tags/helpers';
import { defineStyles, useStyles } from '../hooks/useStyles';
import SearchIcon from '@material-ui/icons/Search';

// Import the mock data and types
import { WikiTagMockup, WikiTagNode } from './types'; // Adjust the import path as needed
import { wikitagMockupData } from './wikitag_mockup_data';

const styles = defineStyles("AllWikiTagsPage", (theme: ThemeType) => ({
  root: {
    padding: "0 100px",
    // maxWidth: 1000,
  },
  topSection: {
    marginBottom: 60,
    display: "flex",
    alignItems: "center",
    gap: "32px",
    height: 60,
  },
  titleSection: {
    flex: "0 0 auto",
  },
  addTagSection: {
    marginLeft: "auto",
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    height: "100%",
    marginBottom: 10,
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
    marginBottom: 8,
  },
  searchContainer: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    margin: "0 auto",
    height: "100%",
  },
  searchIcon: {
    // position: 'absolute',
    // right: '15px',
    // top: '50%',
    // transform: 'translateY(-70%)',
    color: theme.palette.grey[500],
    marginLeft: -25,
  },
  searchBar: {
    width: "100%",
    padding: 12,
    fontSize: "1.4rem",
    boxSizing: "border-box",
    borderRadius: 0,
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
    // overflowY: 'auto',
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
  const baseComponent = Math.sqrt((description_length / 100) + (postCount / 2));
  const random = Math.pow(Math.abs(Math.sin(description_length * 0.1 + postCount * 0.3)), 2) * 8;
  return Math.min(Math.round(baseComponent + random), 25);
}

// Define the buildTree function here
function buildTree(
  items: Omit<WikiTagMockup, 'baseScore'>[], 
  _id: string | null = null, 
  depth = 0, 
  seen: Set<string> = new Set()
): WikiTagNode[] {
  // Prevent excessive recursion
  if (depth > 5) {
    console.warn('Maximum depth exceeded in buildTree');
    return [];
  }

  // Filter items where parentTagId matches the current _id
  const filteredItems = items.filter(item => item.parentTagId === _id);

  return filteredItems.flatMap(item => {
    // Check for circular references
    if (seen.has(item._id)) {
      console.warn(`Circular reference detected for item ${item._id}`);
      return [];
    }

    // Add current item to seen set
    seen.add(item._id);

    // Add baseScore to the item
    const itemWithScore = {
      ...item,
      baseScore: generateBaseScore(item.description_length, item.postCount)
    };

    if (depth === 1) {
      // Skip level 1 items and process their children
      return buildTree(items, item._id, depth + 1, new Set(seen));
    } else {
      // Normal processing for other levels
      const children = buildTree(items, item._id, depth + 1, new Set(seen));
      return [{ ...itemWithScore, children }];
    }
  });
}

const AllWikiTagsPage = () => {
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  const currentUser = useCurrentUser();

  const { SectionButton, SectionTitle, WikiTagNestedList } = Components;
  const [selectedWikiTag, setSelectedWikiTag] = useState<WikiTagMockup | null>(null);
  const [pinnedWikiTag, setPinnedWikiTag] = useState<WikiTagMockup | null>(null);

  const { LWTooltip } = Components;

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

  // Move the tree-building and sorting logic here
  const sortedTree = useMemo(() => {
    const tree = buildTree(wikitagMockupData as Omit<WikiTagMockup, 'baseScore'>[], null, 0);
    
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
      // For all other items, sort by baseScore
      return b.baseScore - a.baseScore;
    });
  }, [prioritySlugs]);

  // Filter the tree to only show priority items at the root level
  const filteredTree = useMemo(() => 
    sortedTree.filter(wikitag => 
      prioritySlugs.includes(wikitag.slug as typeof prioritySlugs[number])
    ), 
    [sortedTree, prioritySlugs]
  );

  return (
    <AnalyticsContext pageContext="allWikiTagsPage">
      <div className={classes.root} onClick={handleBackgroundClick}>

        {/* <div>CURRENTLY SET WIKITAG: {pinnedWikiTag?.name}</div>
        <div>CURRENTLY HOVERED WIKITAG: {selectedWikiTag?.name}</div> */}


        <div className={classes.topSection}>
          <div className={classes.titleSection}>
            <div className={classes.titleClass}>Concepts</div>
          </div>
          
          <div className={classes.searchContainer}>
            <input
              type="text"
              className={classes.searchBar}
              placeholder="What would you like to read about?"
            />
            <SearchIcon className={classes.searchIcon} />
          </div>

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
        </div>
        <div className={classes.mainContent} onClick={handleBackgroundClick}>


          <div className={classes.wikiTagNestedList}>
            <WikiTagNestedList 
              pages={filteredTree}
              onHover={handleHover} 
              onClick={handleClick}
              // pinnedWikiTag={pinnedWikiTag}
            />
          </div>




        </div>
      </div>
    </AnalyticsContext>
  );
}

const AllWikiTagsPageComponent = registerComponent("AllWikiTagsPage", AllWikiTagsPage);

export default AllWikiTagsPageComponent;

declare global {
  interface ComponentTypes {
    AllWikiTagsPage: typeof AllWikiTagsPageComponent
  }
}
