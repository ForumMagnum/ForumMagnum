import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { ConceptItem } from "@/components/tagging/ConceptItem";

const styles = defineStyles("WikiTagNestedList", (theme: ThemeType) => ({
  root: {
    width: "100%",
  },
  childrenList: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  showMoreChildren: {
    fontSize: 12,
    fontWeight: 400,
    color: theme.palette.text.alwaysLightGrey,
    marginBottom: 8,
    marginTop: 2,
    marginLeft: 16,
    width: "100%",
  },
}));

interface WikiTagNode extends ConceptItemFragment {
  parentTagId: string | null;
  baseScore: number;
  children: WikiTagNode[];
}

interface WikiTagNestedListProps {
  pages: WikiTagNode[];
  nestingLevel?: number;
  maxInitialShow?: number;
  totalChildrenCount?: number;
  showArbitalIcons?: boolean;
}

const WikiTagNestedList = ({
  pages,
  nestingLevel = 0,
  maxInitialShow = 40,
  totalChildrenCount,
  showArbitalIcons = false,
}: WikiTagNestedListProps) => {
  const classes = useStyles(styles);

  return (
    <div className={classes.childrenList}>
      {pages.slice(0, maxInitialShow).map(page => (
        <ConceptItem 
          key={page._id} 
          wikitag={page} 
          // TODO: this will be broken but who knows if we're even keeping this component
          isTitleItem={nestingLevel === 0}
          showArbitalIcon={showArbitalIcons}
        />
      ))}
      {pages.length > maxInitialShow && (
        <div className={classes.showMoreChildren}>
          {`Show more (${(totalChildrenCount ?? pages.length) - maxInitialShow} nested pages)`}
        </div>
      )}
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

export {
  WikiTagNestedListComponent as WikiTagNestedList
}
