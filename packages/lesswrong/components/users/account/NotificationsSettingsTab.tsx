import React from 'react';
import { hasEventsSetting, isEAForum, isLW, isLWorAF } from '@/lib/instanceSettings';
import { allowSubscribeToSequencePosts } from '@/lib/betas';
import { ManageSubscriptionsLink } from '@/components/form-components/ManageSubscriptionsLink';
import KarmaChangeNotifierSettings from '@/components/users/KarmaChangeNotifierSettings';
import UsersEmailVerification from '@/components/users/UsersEmailVerification';
import EmailConfirmationRequiredCheckbox from '@/components/users/EmailConfirmationRequiredCheckbox';
import { HighlightableField } from './HighlightableField';
import SettingsSection from './SettingsSection';
import SettingsToggleRow from './SettingsToggleRow';
import NotificationSettingsRow, { NotificationColumnHeaders } from './NotificationSettingsRow';
import type { SettingsTabProps } from './settingsTabTypes';

const NotificationsSettingsTab = ({
  form,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Auto-Subscriptions">
        <HighlightableField name="auto_subscribe_to_my_posts">
          <form.Field name="auto_subscribe_to_my_posts">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Auto-subscribe to my posts"
                description="Get notified when someone comments on your posts"
              />
            )}
          </form.Field>
        </HighlightableField>

        <form.Field name="auto_subscribe_to_my_comments">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Auto-subscribe to my comments"
              description="Get notified when someone replies to your comments"
            />
          )}
        </form.Field>

        {hasEventsSetting.get() && (
          <form.Field name="autoSubscribeAsOrganizer">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Auto-subscribe as organizer"
                description="Get notified about posts/events in groups you organize"
              />
            )}
          </form.Field>
        )}

        <ManageSubscriptionsLink />
      </SettingsSection>

      <SettingsSection title="Followed Content">
        <NotificationColumnHeaders />

        <form.Field name="notificationSubscribedUserPost">
          {(field) => (
            <NotificationSettingsRow field={field} label="Posts by subscribed users" />
          )}
        </form.Field>

        <form.Field name="notificationSubscribedUserComment">
          {(field) => (
            <NotificationSettingsRow field={field} label="Comments by subscribed users" />
          )}
        </form.Field>

        <form.Field name="notificationCommentsOnSubscribedPost">
          {(field) => (
            <NotificationSettingsRow field={field} label="Comments on subscribed posts" />
          )}
        </form.Field>

        <HighlightableField name="notificationSubscribedTagPost">
          <form.Field name="notificationSubscribedTagPost">
            {(field) => (
              <NotificationSettingsRow field={field} label="Posts in subscribed tags" />
            )}
          </form.Field>
        </HighlightableField>

        {allowSubscribeToSequencePosts() && (
          <form.Field name="notificationSubscribedSequencePost">
            {(field) => (
              <NotificationSettingsRow field={field} label="Posts in subscribed sequences" />
            )}
          </form.Field>
        )}

        {hasEventsSetting.get() && (
          <form.Field name="notificationPostsInGroups">
            {(field) => (
              <NotificationSettingsRow field={field} label="Posts/events in subscribed groups" />
            )}
          </form.Field>
        )}

        <form.Field name="notificationShortformContent">
          {(field) => (
            <NotificationSettingsRow
              field={field}
              label={`${isEAForum() ? "Quick takes" : "Shortform"} by subscribed users`}
            />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Replies & Mentions">
        <NotificationColumnHeaders />

        <form.Field name="notificationRepliesToMyComments">
          {(field) => (
            <NotificationSettingsRow field={field} label="Replies to my comments" />
          )}
        </form.Field>

        <form.Field name="notificationRepliesToSubscribedComments">
          {(field) => (
            <NotificationSettingsRow field={field} label="Replies to subscribed comments" />
          )}
        </form.Field>

        <form.Field name="notificationNewMention">
          {(field) => (
            <NotificationSettingsRow field={field} label="Mentions of me" />
          )}
        </form.Field>

        <form.Field name="notificationTypoSuggestions">
          {(field) => (
            <NotificationSettingsRow field={field} label="AI-proposed fixes for typos in my content" />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Messages & Collaboration">
        <NotificationColumnHeaders />

        <form.Field name="notificationPrivateMessage">
          {(field) => (
            <NotificationSettingsRow field={field} label="Private messages" />
          )}
        </form.Field>

        <form.Field name="notificationSharedWithMe">
          {(field) => (
            <NotificationSettingsRow field={field} label="Drafts shared with me" />
          )}
        </form.Field>

        <form.Field name="notificationCommentsOnDraft">
          {(field) => (
            <NotificationSettingsRow field={field} label="Comments on shared drafts" />
          )}
        </form.Field>

        <form.Field name="notificationAddedAsCoauthor">
          {(field) => (
            <NotificationSettingsRow field={field} label="Added as coauthor" />
          )}
        </form.Field>

        <form.Field name="notificationDialogueMessages">
          {(field) => (
            <NotificationSettingsRow field={field} label="New content in my dialogues" />
          )}
        </form.Field>

        <form.Field name="notificationPublishedDialogueMessages">
          {(field) => (
            <NotificationSettingsRow field={field} label="New content in followed dialogues" />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Community & Events">
        <NotificationColumnHeaders />

        <form.Field name="notificationSubforumUnread">
          {(field) => (
            <NotificationSettingsRow field={field} label="New discussions in subscribed topics" />
          )}
        </form.Field>

        {isLWorAF() && (
          <form.Field name="notificationAlignmentSubmissionApproved">
            {(field) => (
              <NotificationSettingsRow field={field} label="AF submission approvals" />
            )}
          </form.Field>
        )}

        {hasEventsSetting.get() && (
          <form.Field name="notificationEventInRadius">
            {(field) => (
              <NotificationSettingsRow field={field} label="Events near me" />
            )}
          </form.Field>
        )}

        {hasEventsSetting.get() && (
          <form.Field name="notificationRSVPs">
            {(field) => (
              <NotificationSettingsRow field={field} label="RSVPs to my events" />
            )}
          </form.Field>
        )}

        {hasEventsSetting.get() && (
          <form.Field name="notificationGroupAdministration">
            {(field) => (
              <NotificationSettingsRow field={field} label="Group administration" />
            )}
          </form.Field>
        )}
      </SettingsSection>

      <SettingsSection title="Karma & Voting">
        <HighlightableField name="karmaChangeNotifierSettings">
          <div className={fieldWrapperClass}>
            <form.Field name="karmaChangeNotifierSettings">
              {(field) => (
                <KarmaChangeNotifierSettings field={field} />
              )}
            </form.Field>
          </div>
        </HighlightableField>
      </SettingsSection>

      <SettingsSection title="Emails">
        <div className={fieldWrapperClass}>
          <form.Field name="whenConfirmationEmailSent">
            {() => <UsersEmailVerification />}
          </form.Field>
        </div>

        {isLW() && <div className={fieldWrapperClass}>
          <form.Field name="emailSubscribedToCurated">
            {(field) => (
              <EmailConfirmationRequiredCheckbox
                field={field}
                label="Email me new posts in Curated"
              />
            )}
          </form.Field>
        </div>}

        <form.Field name="unsubscribeFromAll">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Unsubscribe from all emails"
              description="Stop receiving all email notifications from this site"
            />
          )}
        </form.Field>
      </SettingsSection>
    </div>
  );
};

export default NotificationsSettingsTab;
