import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { eventName, eventTime, eventFormat } from "./PortalBarGcalEventItem";

const styles = theme => ({
  root: {

  },
  eventName: {
    ...eventName
  },
  eventTime: {
    ...eventTime
  }
})

export const GardenCodesList = ({classes}:{classes:ClassesType}) => {
  const currentUser = useCurrentUser()
  const { results, loading } = useMulti({
    terms: {
      view: "userGardenCodes",
      userId: currentUser?._id,
      enableTotal: false,
      fetchPolicy: 'cache-and-network',
    },
    collection: GardenCodes,
    fragmentName: 'GardenCodeFragment'
  });
  console.log("AAAAAAAAAAAAAAAA", results)
  return <div className={classes.root}>
    {results?.map(code=><div key={code._id}>
        <div className={classes.eventName}>
          {code.title}
          </div>
        <div className={classes.eventTime}>
          {eventFormat(code.startTime)}
        </div>
      </div>)}
  </div>
}

const GardenCodesListComponent = registerComponent('GardenCodesList', GardenCodesList, {styles});

declare global {
  interface ComponentTypes {
    GardenCodesList: typeof GardenCodesListComponent
  }
}
