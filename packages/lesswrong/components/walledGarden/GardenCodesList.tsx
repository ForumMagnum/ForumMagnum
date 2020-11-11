import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

export const GardenCodesList = ({classes}:{classes:ClassesType}) => {
  const { GardenCodesItem } = Components
  const currentUser = useCurrentUser()
  const { results } = useMulti({
    terms: {
      view: "userGardenCodes",
      userId: currentUser?._id,
      enableTotal: false,
      fetchPolicy: 'cache-and-network',
    },
    collection: GardenCodes,
    fragmentName: 'GardenCodeFragment'
  });
  return <div>
    {results?.map(code=><GardenCodesItem key={code._id} gardenCode={code}/>)}
  </div>
}

const GardenCodesListComponent = registerComponent('GardenCodesList', GardenCodesList);

declare global {
  interface ComponentTypes {
    GardenCodesList: typeof GardenCodesListComponent
  }
}
