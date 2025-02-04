import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import { Link } from '../../lib/reactRouterWrapper';

const styles = defineStyles('AllPostsPageTagDocDeletionItem', (theme: ThemeType) => ({
  root: {
    background: theme.palette.panelBackground.commentNodeEven,
    border: theme.palette.border.commentBorder,
    borderRight: "none",
    borderRadius: "2px 0 0 2px",
    padding: 12,
    marginLeft: 8,
    marginBottom: 16,
  },
  username: {
    ...theme.typography.commentStyle,
    fontWeight: 600,
    fontSize: "1.16rem",
    color: theme.palette.text.normal,
    marginRight: 12
  }
}));

export interface DocumentDeletion {
  userId: string | null,
  documentId: string,
  netChange: 'deleted' | 'restored',
  type: 'lens' | 'summary',
  docFields?: Pick<Partial<DbMultiDocument>, 'slug' | 'tabTitle' | 'tabSubtitle'>,
  createdAt: Date,
}

const DocumentTitle = ({tag, documentDeletion}: {
  tag: TagHistoryFragment,
  documentDeletion: DocumentDeletion
}) => {
  const { TagsTooltip } = Components;
  const { netChange, docFields, type } = documentDeletion;

  if (type === 'lens') {
    const titleText = `${docFields?.tabTitle} (${docFields?.tabSubtitle})`;
    const maybeLink = netChange === 'restored'
      ? <TagsTooltip tagSlug={docFields?.slug} noPrefetch previewPostCount={0}>
          {/* TODO: link styling? */}
          <Link to={tagGetUrl(tag, { lens: docFields?.slug })}>{titleText}</Link>
        </TagsTooltip>
      : titleText;

    return <>
      lens "
      {maybeLink}
      "
    </>;
  }

  const titleText = docFields?.tabTitle;
  return <>{titleText}</>;
}

export const AllPostsPageTagDocDeletionItem = ({tag, documentDeletion}: {
  tag: TagHistoryFragment,
  documentDeletion: DocumentDeletion,
}) => {
  const classes = useStyles(styles);
  const { UsersName, MetaInfo, FormatDate } = Components;
  
  const actionText = documentDeletion.netChange;

  return <div className={classes.root}>
    <span className={classes.username}>
      <UsersName documentId={documentDeletion.userId ?? undefined} />
    </span>
    {" "}
    <MetaInfo>
      <FormatDate tooltip={false} format={"MMM Do YYYY z"} date={documentDeletion.createdAt}/>
      {` (${actionText} `}
      <DocumentTitle tag={tag} documentDeletion={documentDeletion} />
      {`)`}
    </MetaInfo>
  </div>;
}

const AllPostsPageTagDocDeletionItemComponent = registerComponent('AllPostsPageTagDocDeletionItem', AllPostsPageTagDocDeletionItem);

declare global {
  interface ComponentTypes {
    AllPostsPageTagDocDeletionItem: typeof AllPostsPageTagDocDeletionItemComponent
  }
}
