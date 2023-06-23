import React from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: JssStyles) => ({
  root: {
    padding: 16
  },
  feed: {
    ...theme.typography.body2,
  }
})

//
// Button used to add a new feed to a user profile
//
const NewFeedButton = ({classes, user, closeModal}: {
  classes: ClassesType,
  user: UsersProfile,
  closeModal?: any
}) => {
  const currentUser = useCurrentUser();
  const { Loading, MetaInfo } = Components

  const { results: feeds, loading } = useMulti({
    terms: {view: "usersFeed", userId: user._id},
    collectionName: "RSSFeeds",
    fragmentName: "RSSFeedMinimumInfo"
  });
  
  if (currentUser) {
    return (
      <div className={classes.root}>
        {loading && <Loading/>}
        {feeds?.map(feed => <div key={feed._id} className={classes.feed}>
          <MetaInfo>Existing Feed:</MetaInfo>
          <div><a href={feed.url}>{feed.nickname}</a></div>
        </div>)}
        <Components.WrappedSmartForm
          collectionName="RSSFeeds"
          mutationFragment={getFragment('newRSSFeedFragment')}
          prefilledProps={{userId: user._id}}
          successCallback={() => {
            closeModal();
          }}
        />
        {/*FIXME: This close button doesn't work (closeModal is not a thing)*/}
        <Button onClick={() => closeModal()}>Close</Button>
      </div>
    )
  } else {
    return <div> <Components.Loading /> </div>
  }
}

const newFeedButtonComponent = registerComponent('newFeedButton', NewFeedButton, {styles});

declare global {
  interface ComponentTypes {
    newFeedButton: typeof newFeedButtonComponent
  }
}
