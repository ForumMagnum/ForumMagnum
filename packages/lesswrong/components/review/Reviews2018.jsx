import React, { useState } from 'react';
import { Components, registerComponent, useUpdate } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

const styles = theme => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  settings: {
    marginLeft: theme.spacing.unit*2,
    marginRight: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between"
  }
})

const Reviews2018 = ({classes, currentUser}) => {
  const [expandUnread, setExpandUnread] = useState(!!(currentUser ? !currentUser.noExpandUnreadCommentsReview : true));
  const [sortNominatedPosts, setSortNominatedPosts] = useState("fewestReviews")
  const [sortNominations, setSortNominations] = useState("baseScore")
  const [sortReviews, setSortReviews] = useState("baseScore")

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox, RecentComments } = Components

  const handleSetExpandUnread = () => {
    updateUser({
      selector: {_id: currentUser._id},
      data: { 
        noExpandUnreadCommentsReview: expandUnread,
      }
    });
    setExpandUnread(!expandUnread)
  }

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review"/>
        <div className={classes.settings}>
          <Tooltip title="If checked, posts with unread comments will be sorted first" placement="top">
            <SectionFooterCheckbox
              onClick={handleSetExpandUnread}
              value={expandUnread}
              label={<div className={classes.personalBlogpostsCheckboxLabel}>Expand Unread Comments</div>}
            />
          </Tooltip>
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
        <PostsList2 
          terms={{view:"reviews2018", sortBy: sortNominatedPosts, limit: 100}} 
          showNominationCount
          showReviewCount
          topLoading
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
        <RecentComments terms={{ view: "reviews2018", sortBy: sortReviews}} />
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
        <RecentComments terms={{ view: "nominations2018", sortBy: sortNominations}} />
      </SingleColumnSection>
    </div>
  )
}

registerComponent('Reviews2018', Reviews2018, withStyles(styles, {name:"Reviews2018"}), withUser);
