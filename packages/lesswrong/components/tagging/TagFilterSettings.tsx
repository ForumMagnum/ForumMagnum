import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { FilterSettings, FilterMode as FilterModeType, isCustomFilterMode } from '../../lib/filterSettings';
import { useCurrentUser } from '../common/withUser';
import { tagStyle } from './FooterTag';
import { usePersonalBlogpostInfo } from './usePersonalBlogpostInfo';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';
import { isFriendlyUI } from '../../themes/forumTheme';
import AddTagButton from "./AddTagButton";
import LWTooltip from "../common/LWTooltip";
import FilterMode, { filteringStyles } from './FilterMode';

const styles = (theme: ThemeType) => ({
  root: {
    marginLeft: "auto",
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    ...(isFriendlyUI
      ? {
        marginTop: 8,
      } : {
        gap: "4px",
        marginBottom: 4,
      }),
  },
  addButton: {
    backgroundColor: theme.palette.panelBackground.default,
    paddingLeft: 10,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 10,
    borderRadius: 3,
    fontWeight: 700,
    marginBottom: 4,
    cursor: "pointer",
    border: theme.palette.tag.border
  },
  flexWrapEndGrow: {
    flexGrow: 9999999,
  },
  personalTooltip: {
    ...filteringStyles(theme),
  },
  personalAndPlus: {
    ...(isFriendlyUI ? {} : {
      gap: "4px",
      display: "flex",
      alignItems: "center"
    }),
  }
});

/**
 * Adjust the weighting the frontpage gives to posts with the given tags
 *
 * See the documentation for useFilterSettings for more information about the
 * behavior of filter settings.
 */
const TagFilterSettings = ({
  filterSettings,
  setPersonalBlogFilter,
  setTagFilter,
  removeTagFilter,
  flexWrapEndGrow = true,
  classes
}: {
  filterSettings: FilterSettings,
  setPersonalBlogFilter: (filterMode: FilterModeType) => void,
  setTagFilter: (args: {tagId: string, tagName?: string, filterMode: FilterModeType}) => void,
  removeTagFilter: (tagId: string) => void,
  flexWrapEndGrow?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()

  const {
    name: personalBlogpostName,
    tooltip: personalBlogpostTooltip,
  } = usePersonalBlogpostInfo();

  
  return <span className={classes.root}>
    {filterSettings.tags.map(tagSettings =>
      <FilterMode
        label={tagSettings.tagName}
        key={tagSettings.tagId}
        tagId={tagSettings.tagId}
        mode={tagSettings.filterMode}
        canRemove={true}
        onChangeMode={(mode: FilterModeType) => {
          // If user has clicked on, eg, "Hidden" after it's already selected, return it to default
          // ... but don't apply that to manually input filter settings
          const newMode = mode === tagSettings.filterMode && !isCustomFilterMode(mode) ? 0 : mode
          setTagFilter({tagId: tagSettings.tagId, tagName: tagSettings.tagName, filterMode: newMode})
        }}
        onRemove={() => {
          removeTagFilter(tagSettings.tagId)
        }}
      />
    )}

    {/* Combine these two in one div to make sure that there's never a single element on the second row, if there's overflow */}
    <div className={classes.personalAndPlus}>
      <FilterMode
        label={personalBlogpostName}
        description={personalBlogpostTooltip}
        mode={filterSettings.personalBlog}
        canRemove={false}
        onChangeMode={(mode: FilterModeType) => {
          setPersonalBlogFilter(mode)
        }}
      />

      {<LWTooltip title={`Add ${taggingNameCapitalSetting.get()} Filter`}>
          <AddTagButton hasTooltip={false} onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
            if (!filterSettings.tags.some(t=>t.tagId===tagId)) {
              const defaultFilterMode = userHasNewTagSubscriptions(currentUser) ? 25 : "Default"
              setTagFilter({tagId, tagName, filterMode: defaultFilterMode})
            }
          }}>
            <span className={classes.addButton}>+</span>
          </AddTagButton>
      </LWTooltip>}
    </div>
    {flexWrapEndGrow && <div className={classes.flexWrapEndGrow} />}
  </span>
}

export default registerComponent("TagFilterSettings", TagFilterSettings, {styles});


