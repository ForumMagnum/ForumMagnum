import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
// import { arbitalPageData } from './ArbitalMockupData';
import { useMulti } from '@/lib/crud/withMulti';
import type { ArbitalPage, ArbitalPageNode } from './arbitalTypes';
import { WikiTagNestedList } from "./WikiTagNestedList";
import { Loading } from "../vulcan-core/Loading";
import { InlineSelect } from "../common/InlineSelect";

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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  selectorContainer: {
    color: theme.palette.primary.main,
    fontFamily: theme.palette.fonts.sansSerifStack,
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  centralColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
}));

const ArbitalExplorePageInner = () => {
  const classes = useStyles(styles);
  const [defaultCollapseAfterLevel, setDefaultCollapseAfterLevel] = useState<number>(0);

  // Fetch all Arbital pages
  const { results: arbitalPages, loading } = useMulti({
    collectionName: "Tags",
    fragmentName: "ExplorePageTagFragment",
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
  // const arbitalPageDataFiltered = arbitalPageData
  //   .map((page: ArbitalPage) => {
  //     const matchedTag = arbitalPages.find(result =>
  //       result.legacyData.arbitalPageId === page.pageId
  //     );
  //     return {
  //       ...page,
  //       newSlug: matchedTag?.slug,
  //       contributors: matchedTag?.contributors,
  //     };
  //   });

  // const tree = buildTree(arbitalPageDataFiltered);

  // // Find nodes for "AI alignment" and "Mathematics"
  // const alignmentNode = tree.find(node => node.title === "AI alignment");
  // const mathematicsNode = tree.find(node => node.title === "Mathematics");

  // // Collect other nodes excluding "AI alignment", "Mathematics", and "Arbital"
  // const otherNodes = tree.filter(
  //   node =>
  //     node.title !== "AI alignment" &&
  //     node.title !== "Mathematics" &&
  //     node.title !== "Arbital"
  // );

  // // Create the "Other" node with its children
  // const otherNode: ArbitalPageNode = {
  //   pageId: "other",
  //   title: "Other",
  //   oneLiner: "Other pages that don't fit in the other two categories",
  //   parentPageId: null,
  //   relationship_type: null,
  //   text_length: 0,
  //   authorName: "",
  //   commentCount: 0,
  //   children: otherNodes,
  // };

  // // Assemble the actualTree in the desired order
  // const actualTree = [alignmentNode, mathematicsNode, otherNode].filter(
  //   (node): node is ArbitalPageNode => node !== undefined
  // );

  // const collapseLevelOptions = [
  //   { value: 0, label: 'Collapse All' },
  //   { value: 1, label: 'Collapse to Level 1' },
  //   { value: 2, label: 'Collapse to Level 2' },
  //   { value: 3, label: 'Collapse to Level 3' },
  //   { value: 9999, label: 'Expand All' },
  // ];

  // const defaultCollapseLevel = 2
  // const selectedOption = collapseLevelOptions.find(option => option.value === defaultCollapseAfterLevel) || collapseLevelOptions[defaultCollapseLevel];

  // const handleSelect = (option: { value: number; label: string }) => {
  //   setDefaultCollapseAfterLevel(option.value);
  // };

  return null;

  // return (
  //   <div className={classes.root}>
  //     <div className={classes.centralColumn}>
  //       <div className={classes.selectorContainer}>
  //         <InlineSelect options={collapseLevelOptions} selected={selectedOption} handleSelect={handleSelect} />
  //       </div>
  //       <WikiTagNestedList 
  //         pages={actualTree} 
  //         nestingLevel={0} 
  //         options={{
  //           defaultCollapseAfterLevel: selectedOption.value,
  //         }}
  //       />
  //     </div>
  //   </div>
  // );
};

export const ArbitalExplorePage = registerComponent('ArbitalExplorePage', ArbitalExplorePageInner);




