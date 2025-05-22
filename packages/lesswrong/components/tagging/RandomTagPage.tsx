import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { gql } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery";
import { tagGetUrl } from '@/lib/collections/tags/helpers';
import PermanentRedirect from "../common/PermanentRedirect";
import Loading from "../vulcan-core/Loading";
import SingleColumnSection from "../common/SingleColumnSection";

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

export default registerComponent('RandomTagPage', RandomTagPage);



