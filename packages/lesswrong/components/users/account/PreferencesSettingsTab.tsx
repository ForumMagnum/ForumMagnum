import React from 'react';
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
  form,
  currentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Comments">
        <form.Field name="commentSorting">
          {(field) => (
            <SettingsSelectRow
              field={field}
              options={getCommentViewOptions()}
              label="Default comment sorting"
              description="How comments are ordered when you open a post"
            />
          )}
        </form.Field>

        <form.Field name="noSingleLineComments">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Expand single-line comments"
              description="Always show comments at full height instead of collapsing short ones"
            />
          )}
        </form.Field>

        <form.Field name="noCollapseCommentsPosts">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Don't truncate comments on posts"
              description="Show full comment threads on post pages"
            />
          )}
        </form.Field>

        <form.Field name="noCollapseCommentsFrontpage">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Don't truncate comments on frontpage"
              description="Show full comment threads in the frontpage feed"
            />
          )}
        </form.Field>

        <form.Field name="noKibitz">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Hide author names"
              description="Author names are hidden until you hover over them. Reduces bias when reading. Does not work well on mobile."
            />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Content">
        <form.Field name="sortDraftsBy">
          {(field) => (
            <SettingsSelectRow
              field={field}
              options={SORT_DRAFTS_BY_OPTIONS}
              label="Sort drafts by"
            />
          )}
        </form.Field>

        {isEAForum() && (
          <form.Field name="hideCommunitySection">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide community section"
                description="Remove the community section from the frontpage"
              />
            )}
          </form.Field>
        )}

        {isEAForum() && (
          <form.Field name="showCommunityInRecentDiscussion">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Show community in Recent Discussion"
              />
            )}
          </form.Field>
        )}

        {userCanViewJargonTerms(form.state.values) && (
          <form.Field name="postGlossariesPinned">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Pin glossaries"
                description="Keep glossaries visible on posts and highlight all instances of each term"
              />
            )}
          </form.Field>
        )}

        <form.Field name="hideElicitPredictions">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Hide others' predictions"
              description="Don't show other users' Elicit predictions until you've predicted yourself"
            />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Frontpage">
        {isLW() && (
          <form.Field name="hideFrontpageMap">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide the frontpage map"
              />
            )}
          </form.Field>
        )}

        {isLWorAF() && (
          <form.Field name="hideFrontpageBook2020Ad">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide the frontpage book ad"
              />
            )}
          </form.Field>
        )}

        {isAF() && (
          <form.Field name="hideAFNonMemberInitialWarning">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide AIAF submission info"
                description="Hide explanations of how Alignment Forum submissions work for non-members"
              />
            )}
          </form.Field>
        )}
      </SettingsSection>

      <SettingsSection title="Editor">
        <form.Field name="markDownPostEditor">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Use Markdown editor"
              description="Write posts using Markdown instead of the rich text editor"
            />
          )}
        </form.Field>
      </SettingsSection>

      {hasEventsSetting.get() && (
        <SettingsSection title="Location">
          <HighlightableField name="googleLocation">
            <div className={fieldWrapperClass}>
              <form.Field name="googleLocation">
                {(field) => (
                  <LocationFormComponent
                    field={field}
                    stringVersionFieldName="location"
                    label="Account location (used for location-based recommendations)"
                  />
                )}
              </form.Field>
            </div>
          </HighlightableField>

          {!isEAForum() && <div className={fieldWrapperClass}>
            <form.Field name="mapLocation">
              {(field) => (
                <LocationFormComponent
                  field={field}
                  variant="grey"
                  label="Public map location"
                />
              )}
            </form.Field>
          </div>}
        </SettingsSection>
      )}

      <SettingsSection title="Other">
        <form.Field name="beta">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Beta features"
              description="Get early access to new in-development features"
            />
          )}
        </form.Field>

        <form.Field name="hideIntercom">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Hide Intercom"
              description="Hide the support chat widget"
            />
          )}
        </form.Field>

        {isEAForum() && (userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && (
          <form.Field name="showHideKarmaOption">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Karma visibility controls"
                description="Enable the option on posts to hide karma visibility"
              />
            )}
          </form.Field>
        )}
      </SettingsSection>

      {isEAForum() && (
        <SettingsSection title="Privacy">
          <form.Field name="hideFromPeopleDirectory">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide from People directory"
                description="Your profile won't appear in the People directory"
              />
            )}
          </form.Field>

          <form.Field name="allowDatadogSessionReplay">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Allow Session Replay"
                description="Allow us to capture a video-like recording of your browser session for debugging and site improvements"
              />
            )}
          </form.Field>
        </SettingsSection>
      )}
    </div>
  );
};

export default PreferencesSettingsTab;
