import React from 'react';
import { Components, registerComponent, useMulti } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { useCurrentUser } from '../common/withUser.js';
import { Link } from '../../lib/reactRouterWrapper.jsx';
import { LWEvents } from '../../lib/collections/lwevents/collection.js';

const styles = theme => ({
  subscribedItem: {
    display: "flex",
    ...theme.typography.commentStyle
  },
  subscribedItemDescription: {
    flexGrow: 1,
  },
});

const HistoryPage = ({classes}) => {
  const { SingleColumnSection } = Components;
  const currentUser = useCurrentUser();
  const { results } = useMulti({
    terms: {
      view: "allPostVisits",
      userId: currentUser?._id,
    },
    collection: LWEvents,
    queryName: "personalHistoryList",
    fragmentName: "personalHistoryFragment",
    limit: 5,
    enableTotal: false,
    ssr: true,
    skip: !currentUser
  });
  
  if (!currentUser) {
    return <SingleColumnSection>
      Log in to see your post reading history.
    </SingleColumnSection>;
  }
  
  return <SingleColumnSection>
    {results?.map((event) => <div key={event?._id}>{event?.properties?.postTitle}</div>)}
  </SingleColumnSection>;
}

registerComponent("HistoryPage", HistoryPage,
  withStyles(styles, {name: "HistoryPage"}));
