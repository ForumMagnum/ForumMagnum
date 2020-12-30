import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  loadMore: {
    fontSize: "1rem"
  }
})

export const GardenCodesList = ({classes, limit, personal=false}: {
  classes:ClassesType,
  limit?: number,
  personal?: boolean
}) => {
  const { GardenCodesItem, Loading, LoadMore } = Components
  const currentUser = useCurrentUser()
  
  const terms: GardenCodesViewTerms = personal ?
    {view:"usersPrivateGardenCodes"} :
    {view:"semipublicGardenCodes", types: currentUser?.walledGardenInvite ? ['public', 'semi-public'] : ['public']}
  
  const { results, loading, loadMoreProps } = useMulti({
    terms: {
      userId: currentUser?._id,
      ...terms
    },
    enableTotal: true,
    fetchPolicy: 'cache-and-network',
    collectionName: "GardenCodes",
    fragmentName: 'GardenCodeFragment',
    limit: limit || 5,
    itemsPerPage: 10
  });
  
  
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
