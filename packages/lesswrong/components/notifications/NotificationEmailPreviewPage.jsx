import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { useQuery } from 'react-apollo';
import gql from 'graphql-tag';

const parseNotificationIds = (urlStr) => {
  if (!urlStr) return [];
  return urlStr.split(",");
}

const NotificationEmailPreviewPage = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const notificationIds = parseNotificationIds(query?.notificationIds);
  const { data, loading } = useQuery(gql`
      query EmailPreviewQuery($notificationIds: [String!]) {
        EmailPreview(notificationIds: $notificationIds) { to subject html text }
      }
  `, {
    variables: {notificationIds},
    ssr: true
  });
  
  if (!Users.isAdmin(currentUser))
    return <div>You must be logged in as an admin to use this page.</div>;

  const emails = data?.EmailPreview;
  
  return (
    <Components.SingleColumnSection>
      <p>This is an internal test page for previewing what notifications will look
      like when they are sent as email. To use it, pass a URL parameter like</p>
      <code>
        localhost:3000/debug/notificationEmailPreview?notificationIds=[id1],[id2],[id3]
      </code>
      <p>If there is more than one ID, the notifications must be of the same type
      and the email will be rendered as though the notifications were batched
      together in a daily batch.</p>
      
      {loading && <Components.Loading/>}
      {!loading && emails && emails.map((email,i) =>
        <Components.EmailPreview key={i} email={email}/>
      )}
  </Components.SingleColumnSection>
  );
}

registerComponent("NotificationEmailPreviewPage", NotificationEmailPreviewPage);
