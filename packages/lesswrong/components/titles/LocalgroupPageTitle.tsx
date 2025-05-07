import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../../lib/utils/componentsWithChildren';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const localGroupsBaseQuery = gql(`
  query LocalgroupPageTitle($documentId: String) {
    localgroup(input: { selector: { documentId: $documentId } }) {
      result {
        ...localGroupsBase
      }
    }
  }
`);

const LocalgroupPageTitle = ({siteName}: {
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
  return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
}

const LocalgroupPageTitleComponent = registerComponent("LocalgroupPageTitle", LocalgroupPageTitle);

declare global {
  interface ComponentTypes {
    LocalgroupPageTitle: typeof LocalgroupPageTitleComponent
  }
}

