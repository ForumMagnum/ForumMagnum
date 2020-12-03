import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

export const GardenCodesList = ({classes, personal=false}:{classes:ClassesType, personal?: boolean}) => {
  const { GardenCodesItem } = Components
  const currentUser = useCurrentUser()
  
  const terms = personal ?
    {view:"userGardenCodes"} : 
    {view:"semipublicGardenCodes", types: ['public', 'semi-public']}
  
  const { results } = useMulti({
    terms: {
      userId: currentUser?._id,
      ...terms
    },
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
    collection: GardenCodes,
    fragmentName: 'GardenCodeFragment'
  });
  return <div>
    {results
      ?.filter(code=> !personal || code.type=='private') //for personal list, only show private events; for public list, show all public events
      .map(code=><GardenCodesItem key={code._id} gardenCode={code}/>)}
  </div>
}

const GardenCodesListComponent = registerComponent('GardenCodesList', GardenCodesList);

declare global {
  interface ComponentTypes {
    GardenCodesList: typeof GardenCodesListComponent
  }
}
