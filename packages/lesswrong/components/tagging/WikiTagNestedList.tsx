// TODO: Import component in components.ts
import React, { useMemo } from 'react';
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
  if (depth > 5) {
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

const WikiTagNestedList = ({
  onHover, 
  onClick, 
  pinnedWikiTag
}: {
  onHover: (wikitag: WikiTagMockup | null) => void, 
  onClick: (wikitag: WikiTagMockup) => void,
  pinnedWikiTag: WikiTagMockup | null
}) => {
  const { ConceptItem } = Components;
  const classes = useStyles(styles);

  const prioritySlugs = useMemo(() => ['rationality', 'ai', 'world-modeling', 'world-optimization', 'practical', 'community', 'site-meta'] as const, [])  ;

  const sortedTree = useMemo(() => {
    const tree = buildTree(wikitagMockupData as WikiTagMockup[], null, 0);
    
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
      // For all other items, sort by viewCount
      return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    });
  }, [prioritySlugs]);

  // Filter out tags with no parentTagId and no postCount or postCount === 0
  // const filteredItems = wikitagMockupData.filter(item => item.parentTagId !== null || prioritySlugs.includes(item.slug));

  return (
    <div className={classes.root}>
      {sortedTree.filter(wikitag => prioritySlugs.includes(wikitag.slug as typeof prioritySlugs[number])).map((wikitag, index) => (
        <ConceptItem 
          key={wikitag._id} 
          wikitag={wikitag} 
          nestingLevel={0} 
          index={index} 
          onHover={onHover} 
          onClick={onClick}
          pinnedWikiTag={pinnedWikiTag}
        />
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
