import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { gql } from '@apollo/client';
import { useQueryWrapped } from '@/lib/crud/useQuery';

const RandomTagPage = () => {
  const {PermanentRedirect, Loading, SingleColumnSection} = Components;
  const {data, loading} = useQueryWrapped(gql`
    query getRandomTag {
      RandomTag {slug}
    }
  `, {
    fetchPolicy: "no-cache",
  });
  const tag = data?.RandomTag;
  return <SingleColumnSection>
    {tag && <PermanentRedirect status={302} url={`/tag/${tag.slug}`}/>}
    {loading && <Loading/>}
  </SingleColumnSection>
}

const RandomTagPageComponent = registerComponent('RandomTagPage', RandomTagPage);

declare global {
  interface ComponentTypes {
    RandomTagPage: typeof RandomTagPageComponent
  }
}

