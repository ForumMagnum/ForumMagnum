import React, {ComponentType, useState} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {AnalyticsContext} from '../../lib/analyticsEvents'
import {tagPostTerms} from '../tagging/TagPage'
import {useMulti} from '../../lib/crud/withMulti'
import {Link} from '../../lib/reactRouterWrapper'
import {TopicsBarTab} from '../common/HomeTagBar'
import {isNotNullOrUndefined} from '../../lib/utils/typeGuardUtils'

const FRONTPAGE_TAB_NAME = 'Frontpage'

const styles = (theme: ThemeType): JssStyles => ({
  spotlightMargin: {
    marginBottom: 24,
  },
  learnMoreLink: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600
  },
})


// The order in which the topics are displayed is slightly different from their default ordering
const topicTabsOrder = [
  'sWcuTyTB5dP3nas2t', // Global health
  'QdH9f8TC6G8oGYdgt', // Animal welfare
  'oNiQsBHA3i837sySD', // AI safety
  'ZCihBFp5P64JCvQY6', // Community
  'H43gvLzBCacxxamPe', // Biosecurity & pandemics
  'ee66CtAMYurQreWBH', // Existential risk
  '4eyeLKC64Yvznzt6Z', // Philosophy
  'EHLmbEmJ2Qd5WfwTb', // Building effective altruism
  'of9xBvR3wpbp6qsZC', // Policy
  'psBzwdY8ipfCeExJ7', // Cause prioritization
  'L6NqHZkLc4xZ7YtDr', // Effective giving
  '4CH9vsvzyk4mSKwyZ', // Career choice
  'aJnrnnobcBNWRsfAw', // Forecasting & estimation
]

const sortTopics = (topics: Array<TopicsBarTab>) => 
  topicTabsOrder.map(topicId => topics.find(t => t._id === topicId)).filter(isNotNullOrUndefined)

/**
 * This handles displaying the main content on the EA Forum home page,
 * which includes the topics bar and the topic-specific tabs.
 * The "Frontpage" tab content comes from EAHome.
 */
const EAHomeMainContent = ({FrontpageNode, classes}:{
  FrontpageNode: ComponentType,
  classes: ClassesType
}) => {
  const frontpageTab = {_id: '0', name: FRONTPAGE_TAB_NAME}
  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)
  const activeCoreTopic = activeTab._id === frontpageTab._id ? null : activeTab as TagDetailsFragment
  
  const { results: spotLightResults } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: 'spotlightForSequence',
      sequenceId: activeCoreTopic?.sequence?._id,
      limit: 1
    },
    skip: !activeCoreTopic?.sequence?._id,
  });
  const spotlight = spotLightResults?.[0]
  
  const { SingleColumnSection, SectionTitle, PostsList2, DismissibleSpotlightItem, HomeTagBar } = Components
  
  const topicPostTerms = {
    ...tagPostTerms(activeTab, {}),
    sortedBy: 'magic',
    limit: 30
  }

  return (
    <>
      <HomeTagBar onTagSelectionUpdated={setActiveTab} sortTopics={sortTopics} frontpageTab={frontpageTab}/>

      {activeTab.name === FRONTPAGE_TAB_NAME ? <FrontpageNode/> : <AnalyticsContext pageSectionContext="topicSpecificPosts">
        <SingleColumnSection>
          {spotlight && <DismissibleSpotlightItem
            spotlight={spotlight}
            className={classes.spotlightMargin}
          />}
          <SectionTitle title="New & upvoted" noTopMargin>
            <Link to={`/topics/${activeTab.slug}`} className={classes.learnMoreLink}>View more</Link>
          </SectionTitle>
          <PostsList2
            terms={topicPostTerms}
            itemsPerPage={30}
            hideTag
          />
        </SingleColumnSection>
      </AnalyticsContext>}
    </>
  )
}

const EAHomeMainContentComponent = registerComponent('EAHomeMainContent', EAHomeMainContent, {styles});

declare global {
  interface ComponentTypes {
    EAHomeMainContent: typeof EAHomeMainContentComponent
  }
}
