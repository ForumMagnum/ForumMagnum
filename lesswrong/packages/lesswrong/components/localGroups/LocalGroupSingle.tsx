import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useLocation } from '../../lib/routeUtil';
import LocalGroupPage from "@/components/localGroups/LocalGroupPage";

const LocalGroupSingle = () => {
  const { params } = useLocation();
  return <LocalGroupPage documentId={params.groupId}/>
}

const LocalGroupSingleComponent = registerComponent('LocalGroupSingle', LocalGroupSingle);

declare global {
  interface ComponentTypes {
    LocalGroupSingle: typeof LocalGroupSingleComponent
  }
}

export default LocalGroupSingleComponent;

