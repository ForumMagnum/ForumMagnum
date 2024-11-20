// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import arbitalPageData from './ArbitalMockupData.json';

// Define the type for an arbital page
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

// Extend the type to include children for tree nodes
export interface ArbitalPageNode extends ArbitalPage {
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


const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const WikiTagNestedList = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {

  const { WikiTagItem } = Components;
  const tree = buildTree(arbitalPageData);

  // let's make the root tree have three nodes: AI alignment (existing in data), Mathematics (existing in data), and "Other" (not existing in data)

  const otherNode: ArbitalPageNode = {
    pageId: "other",
    title: "Other",
    oneLiner: "Other pages that don't fit in the other two categories",
    children: [],
    parentPageId: null,
    relationship_type: null,
    text_length: 0,
    authorName: "",
    commentCount: 0,
  };

  //let's process the tree to extract Alignment and Mathematics nodes with their children, and add all other top level nodes to the "other" node
  const alignmentAndMathNodes = tree.filter(node => node.title === "AI alignment" || node.title === "Mathematics");
  const otherNodes = tree.filter(node => node.title !== "AI alignment" && node.title !== "Mathematics" && node.title !== "Arbital");
  otherNode.children = otherNodes;

  const actualTree = [...alignmentAndMathNodes, otherNode];



  console.log("in WikiTagNestedList", tree);

  return (
    <div className={classes.root}>
      {actualTree.slice(0, 10).map(page => (
        <WikiTagItem key={page.pageId} page={page} nestingLevel={0} />
      ))}
    </div>
  );

}

const WikiTagNestedListComponent = registerComponent('WikiTagNestedList', WikiTagNestedList, {styles});

declare global {
  interface ComponentTypes {
    WikiTagNestedList: typeof WikiTagNestedListComponent
  }
}
