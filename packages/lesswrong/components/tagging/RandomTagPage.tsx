import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { gql } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
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

