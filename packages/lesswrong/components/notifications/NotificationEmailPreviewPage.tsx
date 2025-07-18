import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import EmailPreview from "./EmailPreview";

const parseIds = (urlStr: string): Array<string> => {
  if (!urlStr) return [];
  return urlStr.split(",");
}

const NotificationEmailPreviewPage = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const notificationIds = parseIds(query?.notificationIds);
  const postId = query?.postId;
  const { data, loading } = useQuery(gql(`
      query EmailPreviewQuery($notificationIds: [String], $postId: String) {
        EmailPreview(notificationIds: $notificationIds, postId: $postId) { to subject html text }
      }
  `), {
    variables: {notificationIds, postId},
    ssr: true
  });
  
  if (!userIsAdmin(currentUser))
    return <div>You must be logged in as an admin to use this page.</div>;

  const emails = data?.EmailPreview;
  
  return (
    <SingleColumnSection>
      <p>This is an internal test page for previewing what notifications/posts will look
      like when they are sent as email. To use it, pass a URL parameter like</p>
      <code>
        localhost:3000/debug/notificationEmailPreview?notificationIds=[id1],[id2],[id3]
      </code>
      <p>or</p>
      <code>
        localhost:3000/debug/notificationEmailPreview?postId=[id]
      </code>
      <p>Use notificationIds to preview anything using the modern notification
      api. Use postId to see what the curation email will look like for that post.</p>
      <p>If there is more than one notification ID, the notifications must be of
      the same type and the email will be rendered as though the notifications
      were batched together in a daily batch.</p>
      <br/><br/>
      
      {loading && <Loading/>}
      {!loading && emails && emails.filter(email => !!email).map((email, i: number) =>
        <EmailPreview key={i} email={email}/>
      )}
  </SingleColumnSection>
  );
}

export default registerComponent("NotificationEmailPreviewPage", NotificationEmailPreviewPage);



