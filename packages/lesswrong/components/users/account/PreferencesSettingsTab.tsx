import React, { useRef } from 'react';
import { hasEventsSetting, isAF, isEAForum, isLW, isLWorAF } from '@/lib/instanceSettings';
import { getCommentViewOptions } from '@/lib/commentViewOptions';
import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { HighlightableField } from './HighlightableField';
import SettingsSection from './SettingsSection';
import SettingsToggleRow from './SettingsToggleRow';
import SettingsSelectRow from './SettingsSelectRow';
import type { SettingsTabProps } from './settingsTabTypes';
import { userCanViewJargonTerms } from '@/lib/betas';

const SORT_DRAFTS_BY_OPTIONS = [
  { value: "wordCount", label: "Wordcount" },
  { value: "modifiedAt", label: "Last Modified" },
];

const PreferencesSettingsTab = ({
  settings,
  updateSettings,
  bind,
  currentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  // googleLocation has a companion plain-string field ("location") that
  // LocationFormComponent sets through form.setFieldValue just before it
  // calls handleChange; stash it so both fields save in one mutation.
  const pendingLocationStringRef = useRef<string | null>(null);
  const googleLocationBinding = {
    state: { value: settings.googleLocation, meta: { errors: [] } },
    handleChange: (value: AnyBecauseHard) => {
      void updateSettings({
        googleLocation: value,
        location: pendingLocationStringRef.current,
      });
      pendingLocationStringRef.current = null;
    },
    form: {
      setFieldValue: (_name: AnyBecauseHard, value: AnyBecauseHard) => {
        pendingLocationStringRef.current = value;
      },
    },
  };

  return (
    <div>
      <SettingsSection title="Comments">
        <SettingsSelectRow
          value={settings.commentSorting}
          onChange={(value) => void updateSettings({ commentSorting: value })}
          options={getCommentViewOptions()}
          label="Default comment sorting"
          description="How comments are ordered when you open a post"
        />

        <SettingsToggleRow
          value={settings.noSingleLineComments}
          onChange={(value) => void updateSettings({ noSingleLineComments: value })}
          label="Expand single-line comments"
          description="Always show comments at full height instead of collapsing short ones"
        />

        <SettingsToggleRow
          value={settings.noCollapseCommentsPosts}
          onChange={(value) => void updateSettings({ noCollapseCommentsPosts: value })}
          label="Don't truncate comments on posts"
          description="Show full comment threads on post pages"
        />

        <SettingsToggleRow
          value={settings.noCollapseCommentsFrontpage}
          onChange={(value) => void updateSettings({ noCollapseCommentsFrontpage: value })}
          label="Don't truncate comments on frontpage"
          description="Show full comment threads in the frontpage feed"
        />

        <SettingsToggleRow
          value={settings.noKibitz}
          onChange={(value) => void updateSettings({ noKibitz: value })}
          label="Hide author names"
          description="Author names are hidden until you hover over them. Reduces bias when reading. Does not work well on mobile."
        />
      </SettingsSection>

      <SettingsSection title="Content">
        <SettingsSelectRow
          value={settings.sortDraftsBy}
          onChange={(value) => void updateSettings({ sortDraftsBy: value })}
          options={SORT_DRAFTS_BY_OPTIONS}
          label="Sort drafts by"
        />

        {isEAForum() && (
          <SettingsToggleRow
            value={settings.hideCommunitySection}
            onChange={(value) => void updateSettings({ hideCommunitySection: value })}
            label="Hide community section"
            description="Remove the community section from the frontpage"
          />
        )}

        {isEAForum() && (
          <SettingsToggleRow
            value={settings.showCommunityInRecentDiscussion}
            onChange={(value) => void updateSettings({ showCommunityInRecentDiscussion: value })}
            label="Show community in Recent Discussion"
          />
        )}

        {userCanViewJargonTerms(settings) && (
          <SettingsToggleRow
            value={settings.postGlossariesPinned}
            onChange={(value) => void updateSettings({ postGlossariesPinned: value })}
            label="Pin glossaries"
            description="Keep glossaries visible on posts and highlight all instances of each term"
          />
        )}

        <SettingsToggleRow
          value={settings.hideElicitPredictions}
          onChange={(value) => void updateSettings({ hideElicitPredictions: value })}
          label="Hide others' predictions"
          description="Don't show other users' Elicit predictions until you've predicted yourself"
        />
      </SettingsSection>

      <SettingsSection title="Frontpage">
        {isLW() && (
          <SettingsToggleRow
            value={settings.hideFrontpageMap}
            onChange={(value) => void updateSettings({ hideFrontpageMap: value })}
            label="Hide the frontpage map"
          />
        )}

        {isLWorAF() && (
          <SettingsToggleRow
            value={settings.hideFrontpageBook2020Ad}
            onChange={(value) => void updateSettings({ hideFrontpageBook2020Ad: value })}
            label="Hide the frontpage book ad"
          />
        )}

        {isAF() && (
          <SettingsToggleRow
            value={settings.hideAFNonMemberInitialWarning}
            onChange={(value) => void updateSettings({ hideAFNonMemberInitialWarning: value })}
            label="Hide AIAF submission info"
            description="Hide explanations of how Alignment Forum submissions work for non-members"
          />
        )}
      </SettingsSection>

      <SettingsSection title="Editor">
        <SettingsToggleRow
          value={settings.markDownPostEditor}
          onChange={(value) => void updateSettings({ markDownPostEditor: value })}
          label="Use Markdown editor"
          description="Write posts using Markdown instead of the rich text editor"
        />
      </SettingsSection>

      {hasEventsSetting.get() && (
        <SettingsSection title="Location">
          <HighlightableField name="googleLocation">
            <div className={fieldWrapperClass}>
              <LocationFormComponent
                field={googleLocationBinding}
                stringVersionFieldName="location"
                label="Account location (used for location-based recommendations)"
              />
            </div>
          </HighlightableField>

          {!isEAForum() && <div className={fieldWrapperClass}>
            <LocationFormComponent
              field={bind('mapLocation')}
              variant="grey"
              label="Public map location"
            />
          </div>}
        </SettingsSection>
      )}

      <SettingsSection title="Other">
        <SettingsToggleRow
          value={settings.beta}
          onChange={(value) => void updateSettings({ beta: value })}
          label="Beta features"
          description="Get early access to new in-development features"
        />

        <SettingsToggleRow
          value={settings.hideIntercom}
          onChange={(value) => void updateSettings({ hideIntercom: value })}
          label="Hide Intercom"
          description="Hide the support chat widget"
        />

        {isEAForum() && (userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && (
          <SettingsToggleRow
            value={settings.showHideKarmaOption}
            onChange={(value) => void updateSettings({ showHideKarmaOption: value })}
            label="Karma visibility controls"
            description="Enable the option on posts to hide karma visibility"
          />
        )}
      </SettingsSection>

      {isEAForum() && (
        <SettingsSection title="Privacy">
          <SettingsToggleRow
            value={settings.hideFromPeopleDirectory}
            onChange={(value) => void updateSettings({ hideFromPeopleDirectory: value })}
            label="Hide from People directory"
            description="Your profile won't appear in the People directory"
          />

          <SettingsToggleRow
            value={settings.allowDatadogSessionReplay}
            onChange={(value) => void updateSettings({ allowDatadogSessionReplay: value })}
            label="Allow Session Replay"
            description="Allow us to capture a video-like recording of your browser session for debugging and site improvements"
          />
        </SettingsSection>
      )}
    </div>
  );
};

export default PreferencesSettingsTab;
