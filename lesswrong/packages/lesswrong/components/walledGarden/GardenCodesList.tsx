import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import GardenCodesItem from "@/components/walledGarden/GardenCodesItem";
import LoadMore from "@/components/common/LoadMore";

const styles = (theme: ThemeType) => ({
  loadMore: {
    fontSize: "1rem"
  }
})

export const GardenCodesList = ({classes, limit, personal=false}: {
  classes: ClassesType<typeof styles>,
  limit?: number,
  personal?: boolean
}) => {
  const currentUser = useCurrentUser()
  
  const terms: GardenCodesViewTerms = personal ?
    {view:"usersPrivateGardenCodes"} :
    {view:"publicGardenCodes"}
  
  const { results, loadMoreProps } = useMulti({
    terms: {
      ...(personal && {userId: currentUser?._id}),
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
    <LoadMore className={classes.loadMore} {...loadMoreProps}/>
  </div>
}

const GardenCodesListComponent = registerComponent('GardenCodesList', GardenCodesList, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesList: typeof GardenCodesListComponent
  }
}

export default GardenCodesListComponent;
