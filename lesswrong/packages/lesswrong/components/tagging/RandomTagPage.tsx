import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useQuery, gql } from '@apollo/client';
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import PermanentRedirect from "@/components/common/PermanentRedirect";
import { Loading } from "@/components/vulcan-core/Loading";
import SingleColumnSection from "@/components/common/SingleColumnSection";

const RandomTagPage = () => {
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

export default RandomTagPageComponent;

