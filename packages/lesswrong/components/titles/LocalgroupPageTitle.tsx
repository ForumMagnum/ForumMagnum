import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { useLocation } from '../../lib/routeUtil';
import { Helmet } from '../../lib/utils/componentsWithChildren';

const LocalgroupPageTitle = ({siteName}: {
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

const LocalgroupPageTitleComponent = registerComponent("LocalgroupPageTitle", LocalgroupPageTitle);

declare global {
  interface ComponentTypes {
    LocalgroupPageTitle: typeof LocalgroupPageTitleComponent
  }
}

