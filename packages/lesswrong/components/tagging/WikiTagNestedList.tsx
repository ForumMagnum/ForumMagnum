// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import wikitagMockupData from './wikitag_mockup_data';
import { defineStyles, useStyles } from '../hooks/useStyles';

// Define the type for an arbital page
interface WikiTagMockup {
  "core-tag"?: string;
  _id: string;
  name: string;
  slug: string;
  postCount: number;
  description_html: string;
  description_length: number;
  viewCount?: number;
  parentTagId?: string | null;
}

// Extend the type to include children for tree nodes
interface WikiTagNode extends WikiTagMockup {
  children: WikiTagNode[];
}


// Helper function to build the tree
function buildTree(
  items: WikiTagMockup[], 
  _id: string | null = null, 
  depth: number, 
  seen: Set<string> = new Set()
): WikiTagNode[] {
  // Prevent excessive recursion
  if (depth > 100) {
    console.warn('Maximum depth exceeded in buildTree');
    return [];
  }

  // Filter items where parentTagId matches the current _id
  const filteredItems = items.filter(item => item.parentTagId === _id);

  return filteredItems.map(item => {
    // Check for circular references
    if (seen.has(item._id)) {
      console.warn(`Circular reference detected for item ${item._id}`);
      return { ...item, children: [] };
    }

    // Add current item to seen set
    seen.add(item._id);

    return {
      ...item,
      children: buildTree(items, item._id, depth + 1, new Set(seen)),
    };
  });
}


const styles = defineStyles("WikiTagNestedList", (theme: ThemeType) => ({
  root: {

  }
}));

const WikiTagNestedList = () => {
  const { ConceptItem } = Components;
  const classes = useStyles(styles);


  // Filter out tags with no parentTagId and no postCount or postCount === 0
  const prioritySlugs = ['rationality', 'ai', 'world-modeling', 'world-optimization', 'practical', 'community', 'site-meta'];
  // const filteredItems = wikitagMockupData.filter(item => item.parentTagId !== null || prioritySlugs.includes(item.slug));
  const tree = buildTree(wikitagMockupData as WikiTagMockup[], null, 0);


  /* Sort the tree so that the first items have these slugs, in this order:
   [
    'rationality', 
    'ai', 
    'world-modeling', 
    'world-optimization'
    'practical', 
    'community', 
    'site-meta', 
  ]

  after these, the rest of the tree is sorted by viewCount
  */

  
  const sortedTree = tree.sort((a, b) => {
    const indexA = prioritySlugs.indexOf(a.slug);
    const indexB = prioritySlugs.indexOf(b.slug);
    
    // If both items are in the priority list, sort by priority
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // If only one item is in priority list, it goes first
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // For all other items, sort by viewCount
    return (b.viewCount ?? 0) - (a.viewCount ?? 0);
  });


  // console.log(sortedTree);

  return (
    <div className={classes.root}>
      {sortedTree.filter(wikitag => prioritySlugs.includes(wikitag.slug)).map((wikitag, index) => (
        <ConceptItem key={wikitag._id} wikitag={wikitag} nestingLevel={0} index={index} />
      ))}
    </div>
  );

}

const WikiTagNestedListComponent = registerComponent('WikiTagNestedList', WikiTagNestedList);

export default WikiTagNestedListComponent;

declare global {
  interface ComponentTypes {
    WikiTagNestedList: typeof WikiTagNestedListComponent
  }
}
