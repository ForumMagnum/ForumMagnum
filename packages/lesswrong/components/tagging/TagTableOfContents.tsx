import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { tagUrlBaseSetting, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import type { ToCDisplayOptions } from '../posts/TableOfContents/TableOfContentsList';
import { TableOfContents } from "../posts/TableOfContents/TableOfContents";
import { TableOfContentsRow } from "../posts/TableOfContents/TableOfContentsRow";
import { TagContributorsList } from "./TagContributorsList";

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


const TagTableOfContentsInner = ({tag, expandAll, showContributors, onHoverContributor, displayOptions, classes}: {
  tag: TagPageFragment|AllTagsPageFragment
  expandAll?: () => void,
  showContributors: boolean,
  onHoverContributor?: (contributorId: string) => void,
  displayOptions?: ToCDisplayOptions,
  classes: ClassesType<typeof styles>,
}) => {
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

export const TagTableOfContents = registerComponent("TagTableOfContents", TagTableOfContentsInner, {styles});

declare global {
  interface ComponentTypes {
    TagTableOfContents: typeof TagTableOfContents
  }
}
