import React from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useMulti } from '@/lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';

const styles = defineStyles("RedlinkTagPage", theme => ({
  title: {
  },
}));

export const useRedLinkPingbacks = (tagId: string|undefined) => {
  return useMulti({
    terms: {
      view: "pingbackWikiPages",
      tagId: tagId,
    },
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
    limit: 10,
    enableTotal: true,
    skip: !tagId,
  });
}

function capitalizeFirstLetter(s: string): string {
  return s.substring(0,1).toUpperCase() + s.substring(1);
}

export const inferRedLinkTitle = (tag: TagBasicInfo|null, slug: string|null): string|null => {
  const derivedTitle = slug && slug.split(/[_-]/).map(capitalizeFirstLetter).join(' ');
  
  return tag?.name ?? derivedTitle ?? null;
}

const RedlinkTagPage = ({tag, slug}: {
  tag: TagPageFragment|TagPageWithRevisionFragment|null
  slug?: string
}) => {
  const classes = useStyles(styles);
  const { SingleColumnSection } = Components;
  const { results: pingbacks, loading } = useRedLinkPingbacks(tag?._id);
  const title = inferRedLinkTitle(tag, slug??null);

  return <SingleColumnSection>
    <Link className={classes.title} to={`/w/${tag?.slug ?? slug}`}>{title}</Link>

    <p>This wiki page has not been created yet.</p>
    
    {pingbacks && <>
      <p>These wiki pages link to this page:</p>
      
      <ul>
        {pingbacks?.map(t => <li key={t._id}>{t.name}</li>)}
      </ul>
    </>}
  </SingleColumnSection>
}

const RedlinkTagPageComponent = registerComponent('RedlinkTagPage', RedlinkTagPage);

declare global {
  interface ComponentTypes {
    RedlinkTagPage: typeof RedlinkTagPageComponent
  }
}

