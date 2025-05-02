import React from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
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
          mutationFragmentName={'newRSSFeedFragment'}
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

const NewFeedButtonComponent = registerComponent('NewFeedButton', NewFeedButton, {styles});

declare global {
  interface ComponentTypes {
    NewFeedButton: typeof NewFeedButtonComponent
  }
}
