import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { tagUrlBaseSetting, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import type { ToCDisplayOptions } from '../posts/TableOfContents/TableOfContentsList';

export const styles = (theme: ThemeType) => ({
  tableOfContentsWrapper: {
    position: "relative",
    top: 12,
  },
  randomTagLink: {
    ...theme.typography.commentStyle,
    fontSize: "1.16rem",
    color: theme.palette.grey[600],
    display: "inline-block",
    marginTop: 8,
    marginBottom: 8,
  },
  unreadCount: {
    color: theme.palette.primary.main,
  }
});


const TagTableOfContents = ({tag, expandAll, showContributors, onHoverContributor, displayOptions, classes}: {
  tag: TagPageFragment|AllTagsPageFragment
  expandAll?: () => void,
  showContributors: boolean,
  onHoverContributor?: (contributorId: string) => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
}) => {
  const { TableOfContents, TableOfContentsRow, TagContributorsList } = Components;
  
  if (!tag.tableOfContents) {
    return null;
  }
  return (
    <span className={classes.tableOfContentsWrapper}>
      <TableOfContents
        sectionData={tag.tableOfContents}
        title={tag.name}
        onClickSection={expandAll}
        displayOptions={displayOptions}
      />
      <Link to={`/${tagUrlBaseSetting.get()}/random`} className={classes.randomTagLink}>
        Random {taggingNameCapitalSetting.get()}
      </Link>
      {"contributors" in tag && (
        <>
          <TableOfContentsRow href="#" divider={true} />
          <TagContributorsList onHoverUser={onHoverContributor} tag={tag} />
        </>
      )}
    </span>
  );
}

const TagTableOfContentsComponent = registerComponent("TagTableOfContents", TagTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    TagTableOfContents: typeof TagTableOfContentsComponent
  }
}
