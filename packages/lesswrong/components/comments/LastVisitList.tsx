import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import MenuItem from '@material-ui/core/MenuItem'

// EXERCISE2a: Fill in the type annotations for this component's props.
// Don't use the "any" type. You may have to look at other components which use
// this one to figure out what types things are. When you're done, the code should
// compile with no type errors.

const LastVisitList = ({ postId, currentUser, clickCallback }) => {
  const { results, loading } = useMulti({
    terms: {
      view: "postVisits",
      limit: 4,
      postId: postId,
      userId: currentUser._id
    },
    collectionName: "LWEvents",
    fragmentName: 'lastEventFragment',
    enableTotal: false,
  });
  if (!loading && results) {
    return <>{results.map((event) =>
        <MenuItem key={event._id} dense onClick={() => clickCallback(event.createdAt)}>Visit at:&nbsp;<Components.CalendarDate date={event.createdAt}/> </MenuItem>
      )}</>
  } else {
    return <Components.Loading />
  }
}

const LastVisitListComponent = registerComponent("LastVisitList", LastVisitList);

declare global {
  interface ComponentTypes {
    LastVisitList: typeof LastVisitListComponent,
  }
}

