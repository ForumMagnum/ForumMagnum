import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';

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
  newSlug?: string;
}

// Extend the type to include children for tree nodes
interface ArbitalPageNode extends ArbitalPage {
  children: ArbitalPageNode[];
}

const styles = defineStyles("WikiTagNestedList", (theme: ThemeType) => ({
  root: {
    // Add styles as needed
  },
}));

interface WikiTagNestedListProps {
  pages: ArbitalPageNode[];
  nestingLevel: number;
  options?: {
    sort?: (a: ArbitalPageNode, b: ArbitalPageNode) => number;
    defaultCollapseAfterLevel?: number;
  };
  className?: string;
}

const WikiTagNestedList: React.FC<WikiTagNestedListProps> = ({ pages, nestingLevel, options = {}, className }) => {
  const { WikiTagItem } = Components;
  const classes = useStyles(styles);

  // Apply sorting and filtering options
  let processedPages = pages;

  if (options?.sort) {
    // Apply custom sorting if provided
    processedPages = [...pages].sort(options.sort);
  } else {
    // Default sorting: items with children first, then alphabetically
    processedPages = [...pages].sort((a, b) => {
      const aHasChildren = a.children && a.children.length > 0;
      const bHasChildren = b.children && b.children.length > 0;

      if (aHasChildren && !bHasChildren) {
        return -1; // a comes before b
      } else if (!aHasChildren && bHasChildren) {
        return 1; // b comes before a
      } else {
        return a.title.localeCompare(b.title); // Alphabetical order
      }
    });
  }

  return (
    <div className={classNames(classes.root, className)}>
      {processedPages.map(page => (
        <WikiTagItem key={page.pageId} page={page} nestingLevel={nestingLevel} options={options}/>
      ))}
    </div>
  );
};

const WikiTagNestedListComponent = registerComponent('WikiTagNestedList', WikiTagNestedList);

export default WikiTagNestedListComponent;

declare global {
  interface ComponentTypes {
    WikiTagNestedList: typeof WikiTagNestedListComponent;
  }
}