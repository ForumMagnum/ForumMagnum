import React, {ComponentType, useState} from 'react'
import { registerComponent } from '../../lib/vulcan-lib/components'
import {AnalyticsContext} from '../../lib/analyticsEvents'
import {tagPostTerms} from '../tagging/TagPageUtils'
import {Link} from '../../lib/reactRouterWrapper'
import HomeTagBar, {TopicsBarTab } from '../common/HomeTagBar'
import {isNotNullOrUndefined} from '../../lib/utils/typeGuardUtils'
import { isFriendlyUI } from '../../themes/forumTheme'
import { PostsListViewProvider } from '../hooks/usePostsListView'
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import PostsList2 from "../posts/PostsList2";
import PostsListViewToggle from "../posts/PostsListViewToggle";

const FRONTPAGE_TAB_NAME = 'Frontpage'

const styles = (theme: ThemeType) => ({
  spotlightMargin: {
    marginBottom: 24,
  },
  learnMoreLink: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600
  },
  postsListSettings: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
})

// The order in which the topics are displayed is slightly different from their default ordering
const topicTabsOrder = [
  'z8qFsGt5iXyZiLbjN', // Opportunities
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

const frontpageTab = {_id: '0', name: FRONTPAGE_TAB_NAME}

/**
 * This handles displaying the main content on the EA Forum home page,
 * which includes the topics bar and the topic-specific tabs.
 * The "Frontpage" tab content comes from EAHome.
 */
const EAHomeMainContent = ({FrontpageNode, classes}: {
  FrontpageNode: ComponentType,
  classes: ClassesType<typeof styles>
}) => {
  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)

  const topicPostTerms: PostsViewTerms = {
    ...tagPostTerms(activeTab),
    sortedBy: 'magic',
    limit: 30
  }
  return (
    <PostsListViewProvider>
      <HomeTagBar onTagSelectionUpdated={setActiveTab} sortTopics={sortTopics} frontpageTab={frontpageTab}/>

      {activeTab.name === FRONTPAGE_TAB_NAME ? <FrontpageNode/> : <AnalyticsContext pageSectionContext="topicSpecificPosts">
        <SingleColumnSection>
          {/* {spotlight && <DismissibleSpotlightItem
            spotlight={spotlight}
            className={classes.spotlightMargin}
          />} */}
          <SectionTitle title="New & upvoted" noTopMargin>
            <div className={classes.postsListSettings}>
              <Link to={`/topics/${activeTab.slug}`} className={classes.learnMoreLink}>
                View more
              </Link>
              {isFriendlyUI && <PostsListViewToggle />}
            </div>
          </SectionTitle>
          <PostsList2
            terms={topicPostTerms}
            itemsPerPage={30}
            hideTag
            viewType="fromContext"
          />
        </SingleColumnSection>
      </AnalyticsContext>}
    </PostsListViewProvider>
  )
}

export default registerComponent('EAHomeMainContent', EAHomeMainContent, {styles});


