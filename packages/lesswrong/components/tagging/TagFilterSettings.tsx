import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import type { FilterSettings, FilterMode } from '../../lib/filterSettings';
import { useCurrentUser } from '../common/withUser';
import { tagStyle } from './FooterTag';
import { filteringStyles } from './FilterMode';
import { commentBodyStyles } from '../../themes/stylePiping';
import Card from '@material-ui/core/Card';
import { userHasNewTagSubscriptions } from '../../lib/betas';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

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
    border: `solid 1px rgba(0,0,0,.25)`,
    backgroundColor: "white"
  },
  addButton: {
    backgroundColor: theme.palette.grey[300],
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
    ...commentBodyStyles(theme)
  }
});

const lwafPersonalBlogpostInfo = {
  name: "Personal Blog",
  tooltip: <div>
    <p><b>Personal Blogposts</b> are posts that don't fit LessWrong's Frontpage Guidelines. They get less visibility by default. The frontpage guidelines are:</p>
    <ul>
      <li><em>Timelessness</em>. Will people still care about this in 5 years?</li>
      <li><em>Avoid political topics</em>. They're important to discuss sometimes, but we try to avoid it on LessWrong.</li>
      <li><em>General Appeal</em>. Is this a niche post that only a small fraction of users will care about?</li>
    </ul>
  </div>
}

const personalBlogpostInfo: ForumOptions<{name: string, tooltip: JSX.Element}> = {
  LessWrong: lwafPersonalBlogpostInfo,
  AlignmentForum: lwafPersonalBlogpostInfo,
  EAForum: {
    name: 'Personal',
    tooltip: <div>
      <div>
        By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively. Personal posts get to have looser standards of relevance, and may include topics that could lead to more emotive or heated discussion (e.g. politics), which are generally excluded from Frontpage.
      </div>
    </div>
  },
  default: {
    name: 'Personal',
    tooltip: <div>
      <div>
        By default, the home page only displays Frontpage Posts, which are selected by moderators as especially interesting or useful to people with interest in doing good effectively. Personal posts get to have looser standards of relevance, and may include topics that could lead to more emotive or heated discussion (e.g. politics), which are generally excluded from Frontpage.
      </div>
    </div>
  },
}

const personalBlogpostName = forumSelect(personalBlogpostInfo).name
const personalBlogpostTooltip = forumSelect(personalBlogpostInfo).tooltip

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
  const { AddTagButton, FilterMode, Loading, LWTooltip } = Components
  const currentUser = useCurrentUser()

  const personalBlogpostCard = <Card><div className={classes.personalTooltip}>
    <p><em>Click to show personal blogposts</em></p>
    <div>{personalBlogpostTooltip}</div>
  </div></Card>

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
          const newMode = mode === tagSettings.filterMode ? 0 : mode
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

    {<LWTooltip title="Add Tag Filter">
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
