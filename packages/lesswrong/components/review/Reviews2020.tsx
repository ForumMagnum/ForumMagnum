import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const styles = (theme: ThemeType): JssStyles => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  settings: {
    marginLeft: theme.spacing.unit*2,
    marginRight: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    [theme.breakpoints.down('xs')]: {
      flexDirection: "column",
      alignItems: "flex-end"
    }
  }
})

export const YEAR = 2020

const Reviews2020 = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const [expandUnread, setExpandUnread] = useState(!!(currentUser ? !currentUser.noExpandUnreadCommentsReview : true));
  const [sortNominatedPosts, setSortNominatedPosts] = useState("fewestReviews")
  const [sortReviews, setSortReviews] = useState("new")
  const [sortNominations, setSortNominations] = useState("top")

  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox, RecentComments, LWTooltip, ReviewPhasesWidget } = Components

  const handleSetExpandUnread = () => {
    if (currentUser) {
      void updateUser({
        selector: {_id: currentUser._id},
        data: {
          noExpandUnreadCommentsReview: expandUnread,
        }
      });
    }
    setExpandUnread(!expandUnread)
  }

  const all2019Url = `/allPosts?timeframe=yearly&after=${YEAR}-01-01&before=${YEAR+1}-01-01&limit=100&sortedBy=top&filter=unnominated${YEAR}`

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title={`${YEAR} Review`}/>
        <ReviewPhasesWidget year={YEAR} />
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts">
          <div className={classes.settings}>
            <LWTooltip title="If checked, posts with unread comments will be sorted first" placement="top">
              <SectionFooterCheckbox
                onClick={handleSetExpandUnread}
                value={expandUnread}
                label={<div className={classes.personalBlogpostsCheckboxLabel}>Expand Unread Comments</div>}
              />
            </LWTooltip>
            <Select
              value={sortNominatedPosts}
              onChange={(e)=>setSortNominatedPosts(e.target.value)}
              disableUnderline
            >
              <MenuItem value={'fewestReviews'}>Sort by Fewest Reviews</MenuItem>
              <MenuItem value={'mostReviews'}>Sort by Most Reviews</MenuItem>
              <MenuItem value={'lastCommentedAt'}>Sort by Last Commented At</MenuItem>
            </Select>
          </div>
        </SectionTitle>
        <PostsList2 
          terms={{view:"reviews2019", sortBy: sortNominatedPosts, limit: 100}} 
          showNominationCount
          showReviewCount
          showPostedAt={false}
          topLoading
          dense
          defaultToShowUnreadComments={expandUnread}
          enableTotal
        />
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Reviews">
          <Select
            value={sortReviews}
            onChange={(e)=>setSortReviews(e.target.value)}
            disableUnderline
            >
            <MenuItem value={'top'}>Sorted by Top</MenuItem>
            <MenuItem value={'new'}>Sorted by New</MenuItem>
            <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
          </Select>
        </SectionTitle>
        <RecentComments terms={{ view: "reviews2019", sortBy: sortReviews}} truncated/>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Nominations">
          <Select
            value={sortNominations}
            onChange={(e)=>setSortNominations(e.target.value)}
            disableUnderline
            >
            <MenuItem value={'top'}>Sorted by Top</MenuItem>
            <MenuItem value={'new'}>Sorted by New</MenuItem>
            <MenuItem value={'groupByPost'}>Grouped by Post</MenuItem>
          </Select>
        </SectionTitle>
        <RecentComments terms={{ view: "nominations2019", sortBy: sortNominations}} truncated/>
      </SingleColumnSection>
    </div>
  )
}

const Reviews2020Component = registerComponent('Reviews2020', Reviews2020, {styles});

declare global {
  interface ComponentTypes {
    Reviews2020: typeof Reviews2020Component
  }
}

