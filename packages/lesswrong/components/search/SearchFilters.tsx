import React, { MutableRefObject } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { RefinementListExposed, RefinementListProvided } from 'react-instantsearch/connectors';
import { AlgoliaIndexCollectionName } from '../../lib/search/algoliaUtil';
import { ToggleRefinement, NumericMenu, ClearRefinements, connectRefinementList } from 'react-instantsearch-dom';
import { forumTypeSetting, taggingNamePluralSetting } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';
import Select from '@material-ui/core/Select';
import {
    ElasticSorting,
  elasticCollectionIsCustomSortable,
  formatElasticSorting,
  getElasticSortingsForCollection,
} from '../../lib/search/elasticUtil';
import { communityPath } from '../../lib/routes';

const styles = (theme: ThemeType): JssStyles => ({
  filtersColumn: {
    flex: 'none',
    width: 250,
    maxHeight: "max-content",
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[800],
    paddingTop: 12,
    '& .ais-NumericMenu': {
      marginBottom: 26
    },
    '& .ais-NumericMenu-item': {
      marginTop: 5
    },
    '& .ais-NumericMenu-label': {
      display: 'flex',
      columnGap: 3
    },
    '& .ais-ToggleRefinement-label': {
      display: 'flex',
      columnGap: 6,
      alignItems: 'center',
      marginTop: 12
    },
    '& .ais-ClearRefinements': {
      color: theme.palette.primary.main,
      marginTop: 20
    },
    '& .ais-ClearRefinements-button--disabled': {
      display: 'none'
    },
  },
  filtersHeadline: {
    marginBottom: 18,
    fontWeight: 500,
    fontFamily: theme.palette.fonts.sansSerifStack,
    "&:not(:first-child)": {
      marginTop: 35,
    },
  },
  filterLabel: {
    fontSize: 14,
    color: theme.palette.grey[600],
    marginBottom: 6
  },
  mapLink: {
    color: theme.palette.primary.main,
    padding: 1,
    marginTop: 30
  },
  sort: {
    borderRadius: theme.borderRadius.small,
    width: "100%",
  }
});

type TagsRefinementProps = {
  tagsFilter?: Array<string>,
  setTagsFilter?: Function
}

// filters by tags
const TagsRefinementList = ({ tagsFilter, setTagsFilter }:
  RefinementListProvided & TagsRefinementProps
) => {
  return <Components.TagMultiselect
    value={tagsFilter ?? []}
    path="tags"
    placeholder={`Filter by ${taggingNamePluralSetting.get()}`}
    hidePostCount
    startWithBorder
    updateCurrentValues={(values: {tags?: Array<string>}) => {
      setTagsFilter && setTagsFilter(values.tags)
    }}
  />
}
const CustomTagsRefinementList = connectRefinementList(TagsRefinementList) as React.ComponentClass<RefinementListExposed & TagsRefinementProps>

const SearchFilters = ({classes, tab, tagsFilter, handleUpdateTagsFilter, onSortingChange, sorting, dateRangeValues}:{
  classes: ClassesType
  tab: AlgoliaIndexCollectionName
  tagsFilter: Array<string>
  handleUpdateTagsFilter: (tags: Array<string>) => void
  onSortingChange: (sorting: string) => void
  sorting: ElasticSorting
  dateRangeValues: Array<MutableRefObject<number>>
}) => {

  const [pastDay, pastWeek, pastMonth, pastYear] = dateRangeValues;
  const { Typography, MenuItem } = Components;

  return <div className={classes.filtersColumn}>
    <Typography variant="headline" className={classes.filtersHeadline}>Filters</Typography>
    {['Posts', 'Comments', 'Sequences', 'Users'].includes(tab) && <>
      <div className={classes.filterLabel}>
        Filter by {tab === 'Users' ? 'joined' : 'posted'} date
      </div>
      <NumericMenu
        attribute="publicDateMs"
        items={[
          { label: 'All' },
          { label: 'Past 24 hours', start: pastDay.current },
          { label: 'Past week', start: pastWeek.current },
          { label: 'Past month', start: pastMonth.current },
          { label: 'Past year', start: pastYear.current },
        ]}
      />
    </>}
    {['Posts', 'Comments', 'Users'].includes(tab) && <CustomTagsRefinementList
      attribute="tags"
      defaultRefinement={tagsFilter}
      tagsFilter={tagsFilter}
      setTagsFilter={handleUpdateTagsFilter}
    />
    }
    {tab === 'Posts' && <ToggleRefinement
      attribute="curated"
      label="Curated"
      value={true}
    />}
    {tab === 'Posts' && <ToggleRefinement
      attribute="isEvent"
      label="Exclude events"
      value={false}
      defaultRefinement={true}
    />}
    {tab === 'Tags' && <ToggleRefinement
      attribute="core"
      label="Core topic"
      value={true}
    />}
    <ClearRefinements />

    {tab === 'Users' && forumTypeSetting.get() === 'EAForum' && <div className={classes.mapLink}>
      <Link to={`${communityPath}#individuals`}>View community map</Link>
    </div>}

    {elasticCollectionIsCustomSortable(tab) &&
      <>
        <Typography variant="headline" className={classes.filtersHeadline}>
          Sort
        </Typography>
        <Select
          value={sorting}
          onChange={(e) => onSortingChange(e.target.value)}
          className={classes.sort}
        >
          {getElasticSortingsForCollection(tab).map((name, i) =>
            <MenuItem key={i} value={name}>
              {formatElasticSorting(name)}
            </MenuItem>
          )}
        </Select>
      </>
    }
  </div>
}


const SearchFiltersComponent = registerComponent("SearchFilters", SearchFilters, {styles})

declare global {
  interface ComponentTypes {
    SearchFilters: typeof SearchFiltersComponent
  }
}
