import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { FilterSettings, FilterMode, isCustomFilterMode } from '../../lib/filterSettings';
import { useCurrentUser } from '../common/withUser';
import { tagStyle } from './FooterTag';
import { filteringStyles } from './FilterMode';
import { usePersonalBlogpostInfo } from './usePersonalBlogpostInfo';
import Card from '@material-ui/core/Card';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { taggingNameCapitalSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginLeft: "auto",
    ...theme.typography.commentStyle,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    paddingBottom: 4
  },
  showPersonalBlogposts: {
    ...tagStyle(theme),
    display: "inline-block",
    marginBottom: 4,
    marginRight: 4,
    border: theme.palette.border.slightlyIntense,
    backgroundColor: theme.palette.tag.hollowTagBackground,
  },
  addButton: {
    backgroundColor: theme.palette.tag.addTagButtonBackground,
    paddingLeft: 9,
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 9,
    borderRadius: 3,
    fontWeight: 700,
    marginBottom: 4,
    cursor: "pointer"
  },
  personalTooltip: {
    ...filteringStyles(theme),
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
  classes
}: {
  filterSettings: FilterSettings,
  setPersonalBlogFilter: (filterMode: FilterMode) => void,
  setTagFilter: (args: {tagId: string, tagName?: string, filterMode: FilterMode}) => void,
  removeTagFilter: (tagId: string) => void,
  classes: ClassesType,
}) => {
  const { AddTagButton, FilterMode, Loading, LWTooltip, ContentStyles } = Components
  const currentUser = useCurrentUser()

  const {
    name: personalBlogpostName,
    tooltip: personalBlogpostTooltip,
  } = usePersonalBlogpostInfo();

  const personalBlogpostCard = <Card>
    <ContentStyles contentType="comment" className={classes.personalTooltip}>
      <p><em>Click to show personal blogposts</em></p>
      <div>{personalBlogpostTooltip}</div>
    </ContentStyles>
  </Card>

  const showPersonalBlogpostsButton = (currentUser && (filterSettings.personalBlog === "Hidden"))

  return <span>
    {filterSettings.tags.map(tagSettings =>
      <FilterMode
        label={tagSettings.tagName}
        key={tagSettings.tagId}
        tagId={tagSettings.tagId}
        mode={tagSettings.filterMode}
        canRemove={true}
        onChangeMode={(mode: FilterMode) => {
          // If user has clicked on, eg, "Hidden" after it's already selected, return it to default
          // ... but don't apply that to manually input filter settings
          const newMode = mode === tagSettings.filterMode && !isCustomFilterMode(currentUser, mode) ? 0 : mode
          setTagFilter({tagId: tagSettings.tagId, tagName: tagSettings.tagName, filterMode: newMode})
        }}
        onRemove={() => {
          removeTagFilter(tagSettings.tagId)
        }}
      />
    )}



    {showPersonalBlogpostsButton ?
      <LWTooltip title={personalBlogpostCard} tooltip={false}>
        <div className={classes.showPersonalBlogposts} onClick={() => setPersonalBlogFilter(0)}>
          Show Personal Blogposts
        </div>
      </LWTooltip>
      : 
      <FilterMode
        label={personalBlogpostName}
        description={personalBlogpostTooltip}
        mode={filterSettings.personalBlog}
        canRemove={false}
        onChangeMode={(mode: FilterMode) => {
          setPersonalBlogFilter(mode)
        }}
      />
    }

    {<LWTooltip title={`Add ${taggingNameCapitalSetting.get()} Filter`}>
        <AddTagButton onTagSelected={({tagId,tagName}: {tagId: string, tagName: string}) => {
          if (!filterSettings.tags.some(t=>t.tagId===tagId)) {
            const defaultFilterMode = userHasNewTagSubscriptions(currentUser) ? 25 : "Default"
            setTagFilter({tagId, tagName, filterMode: defaultFilterMode})
          }
        }}>
          <span className={classes.addButton}>+</span>
        </AddTagButton>
    </LWTooltip>}
  </span>
}

const TagFilterSettingsComponent = registerComponent("TagFilterSettings", TagFilterSettings, {styles});

declare global {
  interface ComponentTypes {
    TagFilterSettings: typeof TagFilterSettingsComponent
  }
}
