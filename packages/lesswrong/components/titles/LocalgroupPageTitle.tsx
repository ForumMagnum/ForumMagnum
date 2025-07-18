import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../common/Helmet';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const localGroupsBaseQuery = gql(`
  query LocalgroupPageTitle($documentId: String) {
    localgroup(input: { selector: { documentId: $documentId } }) {
      result {
        ...localGroupsBase
      }
    }
  }
`);

export const LocalgroupPageTitle = ({siteName}: {
  siteName: string,
}) => {
  const { params: {groupId} } = useLocation();
  
  const { loading, data } = useQuery(localGroupsBaseQuery, {
    variables: { documentId: groupId },
    fetchPolicy: 'cache-only',
  });
  const group = data?.localgroup?.result;
  
  if (!group || loading) return null;

  const titleString = `${group.name} - ${siteName}`
  return <Helmet name="title">
    <title>{titleString}</title>
    <meta property='og:title' content={titleString}/>
  </Helmet>
}
