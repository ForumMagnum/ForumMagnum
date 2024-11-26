import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { arbitalPageData } from './ArbitalMockupData';
import { useMulti } from '@/lib/crud/withMulti';

// Define the type for an Arbital page
interface ArbitalPage {
  pageId: string;
  title: string;
  oneLiner: string;
  parentPageId: string | null;
  relationship_type: string | null;
  text_length: number;
  authorName: string;
  commentCount: number;
}

interface ArbitalPageWithNewSlug extends ArbitalPage {
  newSlug?: string;
}

// Extend the type to include children for tree nodes
interface ArbitalPageNode extends ArbitalPageWithNewSlug {
  children: ArbitalPageNode[];
}

// Helper function to build the tree
function buildTree(items: ArbitalPage[], parentId: string | null = null): ArbitalPageNode[] {
  // Filter items where parentPageId matches the current parentId
  const filteredItems = items.filter(item => item.parentPageId === parentId);

  return filteredItems.map(item => ({
    ...item,
    children: buildTree(items, item.pageId),
  }));
}

const styles = defineStyles("ArbitalExplorePage", (theme: ThemeType) => ({
  root: {
    marginLeft: 64,
  },
}));

const ArbitalExplorePage = () => {
  const classes = useStyles(styles);
  const { WikiTagNestedList, Loading } = Components;

  // Fetch all Arbital pages
  const { results: arbitalPages, loading } = useMulti({
    collectionName: "Tags",
    fragmentName: "TagWithLegacyDataFragment",
    terms: {
      view: "allArbitalTags",
      limit: 2000,
    },
  });

  if (loading || !arbitalPages) {
    return <Loading />;
  }

  // Filter arbitalPageData to only include pages present in arbitalPages query
  // and add the newSlug to each page
  const arbitalPageDataFiltered = arbitalPageData
    // .filter(page => arbitalPages.find(result => result.legacyData.arbitalPageId === page.pageId))
    .map(page => ({
      ...page,
      newSlug: arbitalPages.find(result =>
        result.legacyData.arbitalPageId === page.pageId
      )?.slug,
    }));

  const tree = buildTree(arbitalPageDataFiltered);

  // Find nodes for "AI alignment" and "Mathematics"
  const alignmentNode = tree.find(node => node.title === "AI alignment");
  const mathematicsNode = tree.find(node => node.title === "Mathematics");

  // Collect other nodes excluding "AI alignment", "Mathematics", and "Arbital"
  const otherNodes = tree.filter(
    node =>
      node.title !== "AI alignment" &&
      node.title !== "Mathematics" &&
      node.title !== "Arbital"
  );

  // Create the "Other" node with its children
  const otherNode: ArbitalPageNode = {
    pageId: "other",
    title: "Other",
    oneLiner: "Other pages that don't fit in the other two categories",
    parentPageId: null,
    relationship_type: null,
    text_length: 0,
    authorName: "",
    commentCount: 0,
    children: otherNodes,
  };

  // Assemble the actualTree in the desired order
  const actualTree = [alignmentNode, mathematicsNode, otherNode].filter(
    (node): node is ArbitalPageNode => node !== undefined
  );

  return (
    <div className={classes.root}>
      <WikiTagNestedList pages={actualTree} nestingLevel={0} />
    </div>
  );
};

const ArbitalExplorePageComponent = registerComponent('ArbitalExplorePage', ArbitalExplorePage);

export default ArbitalExplorePageComponent;

declare global {
  interface ComponentTypes {
    ArbitalExplorePage: typeof ArbitalExplorePageComponent;
  }
}