import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import {commentBodyStyles} from "../../themes/stylePiping";

const styles = (theme: ThemeType): JssStyles => ({
  loadMore: {
    fontSize: "1rem"
  }
})
  
export const GardenCodesList = ({classes, terms, limit}: {classes:ClassesType, terms: any, limit?: number}) => {
  
  const { GardenCodesItem, Loading, LoadMore } = Components
  const currentUser = useCurrentUser()
  
  // const terms = personal ?
  //   {view:"userGardenCodes"} : 
  //   {view:"semipublicGardenCodes", types: ['public', 'semi-public']}
  
  const { results, loading, loadMoreProps } = useMulti({
    terms: {
      userId: currentUser?._id,
      ...terms
    },
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    collection: GardenCodes,
    fragmentName: 'GardenCodeFragment',
    limit: limit || 5,
    itemsPerPage: 10
  });
  
  console.log({terms, loadMoreProps})
  
  // const resultsFiltered = results?.filter(code => personal ? 
  //   code.type=='private' : 
  //   (currentUser?.walledGardenInvite || code.type=='public')) //for personal list, only show private events; for public list, show all public/semipublic events depending on membership
  
  return <div>
    {results?.map(code=><GardenCodesItem key={code._id} gardenCode={code}/>)}
    {loading ? <Loading/> : <LoadMore className={classes.loadMore} {...loadMoreProps}/>}
  </div>
}

const GardenCodesListComponent = registerComponent('GardenCodesList', GardenCodesList, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesList: typeof GardenCodesListComponent
  }
}
