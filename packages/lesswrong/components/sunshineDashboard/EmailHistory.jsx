import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import withUser from '../common/withUser';

export const EmailHistoryPage = ({currentUser}) => {
  if (!currentUser) return <div/>
  
  return <Components.EmailHistory
    terms={{view: "emailHistory", userId: currentUser._id}}
  />
}

registerComponent('EmailHistoryPage', EmailHistoryPage, withUser);

export const EmailHistory = ({results, classes}) => {
  if (!results) return <Components.Loading/>
  
  return results.map((email,i) => <Components.EmailPreview key={email._id} email={email.properties}/>);
}

registerComponent('EmailHistory', EmailHistory,
  [withMulti, {
    collectionName: 'LWEvents',
    queryName: 'EmailHistory',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  }]
);
