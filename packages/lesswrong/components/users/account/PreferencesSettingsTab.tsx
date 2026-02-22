import { LocationFormComponent } from '@/components/form-components/LocationFormComponent';
import { hasPostRecommendations, userCanViewJargonTerms } from '@/lib/betas';
import { getCommentViewOptions } from '@/lib/commentViewOptions';
import { hasEventsSetting, isAF, isLW } from '@/lib/instanceSettings';
import { HighlightableField } from './HighlightableField';
import SettingsSection from './SettingsSection';
import SettingsSelectRow from './SettingsSelectRow';
import type { SettingsTabProps } from './settingsTabTypes';
import SettingsToggleRow from './SettingsToggleRow';

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

        {hasPostRecommendations() && (
          <form.Field name="hidePostsRecommendations">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide post recommendations"
                description="Don't show recommended posts at the bottom of post pages"
              />
            )}
          </form.Field>
        )}

        {false}

        {false}

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

        <form.Field name="hideFrontpageBook2020Ad">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Hide the frontpage book ad"
            />
          )}
        </form.Field>

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

          {<div className={fieldWrapperClass}>
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

        {false}
      </SettingsSection>

      {false}
    </div>
  );
};

export default PreferencesSettingsTab;
