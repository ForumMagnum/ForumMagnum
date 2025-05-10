import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../../lib/utils/componentsWithChildren';

export const LocalgroupPageTitle = ({siteName}: {
  siteName: string,
}) => {
  const { params: {groupId} } = useLocation();
  
  const { document: group, loading } = useSingle({
    documentId: groupId,
    collectionName: "Localgroups",
    fragmentName: "localGroupsBase",
    fetchPolicy: 'cache-only',
  });
  
  if (!group || loading) return null;

  const titleString = `${group.name} - ${siteName}`
  return <Helmet>
      <title>{titleString}</title>
      <meta property='og:title' content={titleString}/>
    </Helmet>
}
