import React from 'react';
import { registerComponent, withList, Components } from 'meteor/vulcan:core';
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
  [withList, {
    collectionName: 'LWEvents',
    queryName: 'EmailHistory',
    fragmentName: 'emailHistoryFragment',
    enableTotal: false
  }]
);
