import React from 'react';
import { GardenCodes } from '../../lib/collections/gardencodes/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { eventName, eventTime, eventFormat } from "./PortalBarGcalEventItem";

const styles = theme => ({
  event: {
    ...eventName(theme)

  },
  eventTime: {
    ...eventTime(theme)
  }
})

export const GardenCodesList = ({classes}:{classes:ClassesType}) => {
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
  console.log("AAAAAAAAAAAAAAAA", results)
  return <div>
    {results?.map(code=><div key={code._id} className={classes.event}>
        {code.title}
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
