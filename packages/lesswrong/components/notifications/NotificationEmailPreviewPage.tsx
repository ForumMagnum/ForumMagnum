"use client";

import React from 'react';
import { useMutation } from '@apollo/client/react';
import { userIsAdmin } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import SingleColumnSection from "../common/SingleColumnSection";
import Loading from "../vulcan-core/Loading";
import EmailPreview from "./EmailPreview";
import ErrorAccessDenied from '../common/ErrorAccessDenied';

const SendEmailPreviewToSelfMutation = gql(`
  mutation SendEmailPreviewToSelf($input: AdminSendTestEmailInput!) {
    adminSendTestEmail(input: $input) {
      ok
      status
      email
    }
  }
`);

const styles = defineStyles('NotificationEmailPreviewPage', (theme: ThemeType) => ({
  sendToSelf: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sendToSelfError: {
    color: theme.palette.error.main,
  },
}));

const parseIds = (urlStr: string): Array<string> => {
  if (!urlStr) return [];
  return urlStr.split(",");
}

const EmailThisToMeButton = ({email, userId}: {email: EmailPreview, userId: string}) => {
  const classes = useStyles(styles);
  const [sendEmail, {data, loading, error}] = useMutation(SendEmailPreviewToSelfMutation);
  const result = data?.adminSendTestEmail;

  const handleClick = () => {
    const {subject, html, text} = email;
    void sendEmail({variables: {input: {userId, subject, html, text}}});
  };

  return <div className={classes.sendToSelf}>
    <Button variant="contained" color="primary" onClick={handleClick} disabled={loading}>
      Email this to me now
    </Button>
    {result?.ok && <span>Sent to {result.email}</span>}
    {result && !result.ok && <span className={classes.sendToSelfError}>Mailgun returned status {result.status}</span>}
    {error && <span className={classes.sendToSelfError}>{error.message}</span>}
  </div>;
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
    ssr: false
  });
  
  if (!userIsAdmin(currentUser))
    return <ErrorAccessDenied explanation="You must be logged in as an admin to use this page."/>;

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
        <div key={i}>
          <EmailThisToMeButton email={email} userId={currentUser._id}/>
          <EmailPreview email={email}/>
        </div>
      )}
  </SingleColumnSection>
  );
}

export default NotificationEmailPreviewPage;



