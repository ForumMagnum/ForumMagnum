import React from 'react';
import Button from '@material-ui/core/Button';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { useDialog } from '../common/withDialog';

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
const NewFeedButton = ({user}: {
  user: UsersProfile,
}) => {
  const { openDialog } = useDialog();

  function openRegisterRssDialog() {
    openDialog({
      componentName: "NewFeedDialog",
      componentProps: {
        user,
      },
    });
  }
  
  return <a onClick={openRegisterRssDialog}>Register RSS</a>
}

const NewFeedDialog = ({onClose, user, classes}: {
  onClose: () => void,
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const { Loading, MetaInfo, LWDialog } = Components

  const { results: feeds, loading } = useMulti({
    terms: {view: "usersFeed", userId: user._id},
    collectionName: "RSSFeeds",
    fragmentName: "RSSFeedMinimumInfo",
  });
  
  return <LWDialog
    open={true}
    onClose={onClose}
  >
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
          onClose();
        }}
      />
      <Button onClick={() => onClose()}>Close</Button>
    </div>
  </LWDialog>
}

const NewFeedButtonComponent = registerComponent('NewFeedButton', NewFeedButton);
const NewFeedDialogComponent = registerComponent("NewFeedDialog", NewFeedDialog, {styles});

declare global {
  interface ComponentTypes {
    NewFeedButton: typeof NewFeedButtonComponent
    NewFeedDialog: typeof NewFeedDialogComponent
  }
}
