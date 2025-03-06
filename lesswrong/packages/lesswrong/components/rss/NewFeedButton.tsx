import React from 'react';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { getFragment } from "../../lib/vulcan-lib/fragments";
import { Loading } from "@/components/vulcan-core/Loading";
import MetaInfo from "@/components/common/MetaInfo";
import WrappedSmartForm from "@/components/form-components/WrappedSmartForm";

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
        <WrappedSmartForm
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
    return <div> <Loading /> </div>
  }
}

const NewFeedButtonComponent = registerComponent('NewFeedButton', NewFeedButton, {styles});

declare global {
  interface ComponentTypes {
    NewFeedButton: typeof NewFeedButtonComponent
  }
}

export default NewFeedButtonComponent;
