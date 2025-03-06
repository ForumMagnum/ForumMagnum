import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdate } from '../../lib/crud/withUpdate';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import PostsList2 from "@/components/posts/PostsList2";
import SectionFooterCheckbox from "@/components/form-components/SectionFooterCheckbox";
import RecentComments from "@/components/comments/RecentComments";
import LWTooltip from "@/components/common/LWTooltip";
import { MenuItem } from "@/components/common/Menus";
import { Select } from "@/components/mui-replacement";

const styles = (theme: ThemeType) => ({
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

const Reviews2019 = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [expandUnread, setExpandUnread] = useState(!!(currentUser ? !currentUser.noExpandUnreadCommentsReview : true));
  const [sortNominatedPosts, setSortNominatedPosts] = useState("fewestReviews")
  const [sortReviews, setSortReviews] = useState<CommentSortingMode>("new")
  const [sortNominations, setSortNominations] = useState<CommentSortingMode>("top")

  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
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

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2019 Review"/>
        <div className={classes.settings}>
          <LWTooltip title="If checked, posts with unread comments will be sorted first" placement="top">
            <SectionFooterCheckbox
              onClick={handleSetExpandUnread}
              value={expandUnread}
              label={<div>Expand Unread Comments</div>}
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
        <PostsList2 
          terms={{view:"reviews2019", limit: 100}} 
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
            onChange={(e)=>setSortReviews(e.target.value as CommentSortingMode)}
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
            onChange={(e)=>setSortNominations(e.target.value as CommentSortingMode)}
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

const Reviews2019Component = registerComponent('Reviews2019', Reviews2019, {styles});

declare global {
  interface ComponentTypes {
    Reviews2019: typeof Reviews2019Component
  }
}

export default Reviews2019Component;

