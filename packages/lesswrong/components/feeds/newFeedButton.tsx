import React from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: JssStyles) => ({
  root: {
    padding: 16
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
  const { Loading } = Components

  const { results: feeds, loading } = useMulti({
    terms: {view: "usersFeed", userId: user._id},
    collectionName: "RSSFeeds",
    fragmentName: "RSSFeedMinimumInfo",
    fetchPolicy: 'cache-and-network',
  });
  
  if (currentUser) {
    return (
      <div className={classes.root}>
        {loading && <Loading/>}
        {feeds?.map(feed => <Link to={feed.url} key={feed._id}>{feed.nickname}</Link>)}
        <Components.WrappedSmartForm
          collection={RSSFeeds}
          mutationFragment={getFragment('newRSSFeedFragment')}
          prefilledProps={{userId: user._id}}
          successCallback={conversation => {
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
