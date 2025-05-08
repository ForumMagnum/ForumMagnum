import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery, gql } from '@apollo/client';
import { tagGetUrl } from '@/lib/collections/tags/helpers';

const RandomTagPageInner = () => {
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

export const RandomTagPage = registerComponent('RandomTagPage', RandomTagPageInner);

declare global {
  interface ComponentTypes {
    RandomTagPage: typeof RandomTagPage
  }
}

