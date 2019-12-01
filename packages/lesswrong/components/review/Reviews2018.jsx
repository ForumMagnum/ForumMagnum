import React, { useState } from 'react';
import { Components, registerComponent, useUpdate } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import Users from 'meteor/vulcan:users';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  setting: {
    ...theme.typography.body2,
    color: theme.palette.grey[600]
  },
  settings: {
    marginBottom: theme.spacing.unit*2
  }
})

const Reviews2018 = ({classes, currentUser}) => {
  const [expandUnread, setExpandUnread] = useState(!!(currentUser ? !currentUser.noExpandUnreadCommentsReview : true));

  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });
  const { SingleColumnSection, SectionTitle, PostsList2, SectionFooterCheckbox } = Components

  const handleSetExpandUnread = () => {
    const newExpandUnread = !expandUnread
    updateUser({
      selector: {_id: currentUser._id},
      data: { 
        noExpandUnreadCommentsReview: !newExpandUnread,
      }
    });
    setExpandUnread(newExpandUnread)
  }

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Nominated Posts for the 2018 Review" />
        <div className={classes.settings}>
          <Tooltip title="If checked, posts with unread comments will be sorted first" placement="top">
            <SectionFooterCheckbox
              onClick={handleSetExpandUnread}
              value={expandUnread}
              label={<div className={classes.personalBlogpostsCheckboxLabel}>Expand Unread Comments</div>}
            />
          </Tooltip>
        </div>
        <PostsList2 
          terms={{view:"reviews2018", limit: 100}} 
          showNominationCount
          showReviewCount
          defaultToShowUnreadComments={expandUnread}
          enableTotal
        />
      </SingleColumnSection>
    </div>
  )
}

registerComponent('Reviews2018', Reviews2018, withStyles(styles, {name:"Reviews2018"}), withUser);
