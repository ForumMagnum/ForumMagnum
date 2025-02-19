import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useQuery, gql } from '@apollo/client';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

const RandomTagPage = () => {
  const {PermanentRedirect, Loading, SingleColumnSection} = Components;
  const {data, loading} = useQuery(gql`
    query getRandomTag {
      RandomTag {slug}
    }
  `, {
    fetchPolicy: "no-cache",
  });
  const tag = data?.RandomTag;
  return <SingleColumnSection>
    {tag && <PermanentRedirect status={302} url={tagGetUrl({slug: tag.slug})}/>}
    {loading && <Loading/>}
  </SingleColumnSection>
}

const RandomTagPageComponent = registerComponent('RandomTagPage', RandomTagPage);

declare global {
  interface ComponentTypes {
    RandomTagPage: typeof RandomTagPageComponent
  }
}

