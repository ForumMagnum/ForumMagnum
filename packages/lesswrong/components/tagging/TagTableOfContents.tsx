import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { tagUrlBaseSetting, taggingNameCapitalSetting } from '../../lib/instanceSettings';
import type { ToCDisplayOptions } from '../posts/TableOfContents/TableOfContentsList';
import TableOfContents from "../posts/TableOfContents/TableOfContents";
import TableOfContentsRow from "../posts/TableOfContents/TableOfContentsRow";
import TagContributorsList from "./TagContributorsList";
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("TagTableOfContents", (theme: ThemeType) => ({
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
}));


const TagTableOfContents = ({tag, expandAll, showContributors, onHoverContributor, displayOptions}: {
  tag: TagPageFragment|AllTagsPageFragment
  expandAll?: () => void,
  showContributors: boolean,
  onHoverContributor?: (contributorId: string) => void,
  displayOptions?: ToCDisplayOptions,
}) => {
  const classes = useStyles(styles);
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

export default TagTableOfContents;


