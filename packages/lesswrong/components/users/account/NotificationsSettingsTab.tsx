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
  settings,
  updateSettings,
  bind,
  isCurrentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Auto-Subscriptions">
        <HighlightableField name="auto_subscribe_to_my_posts">
          <SettingsToggleRow
            value={settings.auto_subscribe_to_my_posts}
            onChange={(value) => void updateSettings({ auto_subscribe_to_my_posts: value })}
            label="Auto-subscribe to my posts"
            description="Get notified when someone comments on your posts"
          />
        </HighlightableField>

        <SettingsToggleRow
          value={settings.auto_subscribe_to_my_comments}
          onChange={(value) => void updateSettings({ auto_subscribe_to_my_comments: value })}
          label="Auto-subscribe to my comments"
          description="Get notified when someone replies to your comments"
        />

        {hasEventsSetting.get() && (
          <SettingsToggleRow
            value={settings.autoSubscribeAsOrganizer}
            onChange={(value) => void updateSettings({ autoSubscribeAsOrganizer: value })}
            label="Auto-subscribe as organizer"
            description="Get notified about posts/events in groups you organize"
          />
        )}

        <ManageSubscriptionsLink />
      </SettingsSection>

      <SettingsSection title="Followed Content">
        <NotificationColumnHeaders />

        <NotificationSettingsRow
          name="notificationSubscribedUserPost"
          value={settings.notificationSubscribedUserPost ?? null}
          onChange={(value) => void updateSettings({ notificationSubscribedUserPost: value })}
          label="Posts by subscribed users"
        />

        <NotificationSettingsRow
          name="notificationSubscribedUserComment"
          value={settings.notificationSubscribedUserComment ?? null}
          onChange={(value) => void updateSettings({ notificationSubscribedUserComment: value })}
          label="Comments by subscribed users"
        />

        <NotificationSettingsRow
          name="notificationCommentsOnSubscribedPost"
          value={settings.notificationCommentsOnSubscribedPost ?? null}
          onChange={(value) => void updateSettings({ notificationCommentsOnSubscribedPost: value })}
          label="Comments on subscribed posts"
        />

        <HighlightableField name="notificationSubscribedTagPost">
          <NotificationSettingsRow
            name="notificationSubscribedTagPost"
            value={settings.notificationSubscribedTagPost ?? null}
            onChange={(value) => void updateSettings({ notificationSubscribedTagPost: value })}
            label="Posts in subscribed tags"
          />
        </HighlightableField>

        {allowSubscribeToSequencePosts() && (
          <NotificationSettingsRow
            name="notificationSubscribedSequencePost"
            value={settings.notificationSubscribedSequencePost ?? null}
            onChange={(value) => void updateSettings({ notificationSubscribedSequencePost: value })}
            label="Posts in subscribed sequences"
          />
        )}

        {hasEventsSetting.get() && (
          <NotificationSettingsRow
            name="notificationPostsInGroups"
            value={settings.notificationPostsInGroups ?? null}
            onChange={(value) => void updateSettings({ notificationPostsInGroups: value })}
            label="Posts/events in subscribed groups"
          />
        )}

        <NotificationSettingsRow
          name="notificationShortformContent"
          value={settings.notificationShortformContent ?? null}
          onChange={(value) => void updateSettings({ notificationShortformContent: value })}
          label={`${isEAForum() ? "Quick takes" : "Shortform"} by subscribed users`}
        />
      </SettingsSection>

      <SettingsSection title="Replies & Mentions">
        <NotificationColumnHeaders />

        <NotificationSettingsRow
          name="notificationRepliesToMyComments"
          value={settings.notificationRepliesToMyComments ?? null}
          onChange={(value) => void updateSettings({ notificationRepliesToMyComments: value })}
          label="Replies to my comments"
        />

        <NotificationSettingsRow
          name="notificationRepliesToSubscribedComments"
          value={settings.notificationRepliesToSubscribedComments ?? null}
          onChange={(value) => void updateSettings({ notificationRepliesToSubscribedComments: value })}
          label="Replies to subscribed comments"
        />

        <NotificationSettingsRow
          name="notificationNewMention"
          value={settings.notificationNewMention ?? null}
          onChange={(value) => void updateSettings({ notificationNewMention: value })}
          label="Mentions of me"
        />

        <NotificationSettingsRow
          name="notificationTypoSuggestions"
          value={settings.notificationTypoSuggestions ?? null}
          onChange={(value) => void updateSettings({ notificationTypoSuggestions: value })}
          label="AI-proposed fixes for typos in my content"
        />
      </SettingsSection>

      <SettingsSection title="Messages & Collaboration">
        <NotificationColumnHeaders />

        <NotificationSettingsRow
          name="notificationPrivateMessage"
          value={settings.notificationPrivateMessage ?? null}
          onChange={(value) => void updateSettings({ notificationPrivateMessage: value })}
          label="Private messages"
        />

        <NotificationSettingsRow
          name="notificationSharedWithMe"
          value={settings.notificationSharedWithMe ?? null}
          onChange={(value) => void updateSettings({ notificationSharedWithMe: value })}
          label="Drafts shared with me"
        />

        <NotificationSettingsRow
          name="notificationCommentsOnDraft"
          value={settings.notificationCommentsOnDraft ?? null}
          onChange={(value) => void updateSettings({ notificationCommentsOnDraft: value })}
          label="Comments on shared drafts"
        />

        <NotificationSettingsRow
          name="notificationAddedAsCoauthor"
          value={settings.notificationAddedAsCoauthor ?? null}
          onChange={(value) => void updateSettings({ notificationAddedAsCoauthor: value })}
          label="Added as coauthor"
        />

        <NotificationSettingsRow
          name="notificationDialogueMessages"
          value={settings.notificationDialogueMessages ?? null}
          onChange={(value) => void updateSettings({ notificationDialogueMessages: value })}
          label="New content in my dialogues"
        />

        <NotificationSettingsRow
          name="notificationPublishedDialogueMessages"
          value={settings.notificationPublishedDialogueMessages ?? null}
          onChange={(value) => void updateSettings({ notificationPublishedDialogueMessages: value })}
          label="New content in followed dialogues"
        />
      </SettingsSection>

      <SettingsSection title="Community & Events">
        <NotificationColumnHeaders />

        <NotificationSettingsRow
          name="notificationSubforumUnread"
          value={settings.notificationSubforumUnread ?? null}
          onChange={(value) => void updateSettings({ notificationSubforumUnread: value })}
          label="New discussions in subscribed topics"
        />

        {isLWorAF() && (
          <NotificationSettingsRow
            name="notificationAlignmentSubmissionApproved"
            value={settings.notificationAlignmentSubmissionApproved ?? null}
            onChange={(value) => void updateSettings({ notificationAlignmentSubmissionApproved: value })}
            label="AF submission approvals"
          />
        )}

        {hasEventsSetting.get() && (
          <NotificationSettingsRow
            name="notificationEventInRadius"
            value={settings.notificationEventInRadius ?? null}
            onChange={(value) => void updateSettings({ notificationEventInRadius: value })}
            label="Events near me"
          />
        )}

        {hasEventsSetting.get() && (
          <NotificationSettingsRow
            name="notificationRSVPs"
            value={settings.notificationRSVPs ?? null}
            onChange={(value) => void updateSettings({ notificationRSVPs: value })}
            label="RSVPs to my events"
          />
        )}

        {hasEventsSetting.get() && (
          <NotificationSettingsRow
            name="notificationGroupAdministration"
            value={settings.notificationGroupAdministration ?? null}
            onChange={(value) => void updateSettings({ notificationGroupAdministration: value })}
            label="Group administration"
          />
        )}
      </SettingsSection>

      <SettingsSection title="Karma & Voting">
        <HighlightableField name="karmaChangeNotifierSettings">
          <div className={fieldWrapperClass}>
            <KarmaChangeNotifierSettings field={bind('karmaChangeNotifierSettings')} />
          </div>
        </HighlightableField>
      </SettingsSection>

      <SettingsSection title="Emails">
        {/* Operates on the logged-in user's own verification state, so hide it
            when an admin is editing someone else's settings */}
        {isCurrentUser && <div className={fieldWrapperClass}>
          <UsersEmailVerification />
        </div>}

        {isLW() && <div className={fieldWrapperClass}>
          <EmailConfirmationRequiredCheckbox
            field={bind('emailSubscribedToCurated')}
            label="Email me new posts in Curated"
          />
        </div>}

        <SettingsToggleRow
          value={settings.unsubscribeFromAll}
          onChange={(value) => void updateSettings({ unsubscribeFromAll: value })}
          label="Unsubscribe from all emails"
          description="Stop receiving all email notifications from this site"
        />
      </SettingsSection>
    </div>
  );
};

export default NotificationsSettingsTab;
