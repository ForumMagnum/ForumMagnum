import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from 'react-router';
import Users from "meteor/vulcan:users";
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  frontpageSequencesGridList: {
    [legacyBreakpoints.maxSmall]: {
      marginTop: 40,
    }
  }
});

const AlignmentForumHome = ({currentUser, classes}) => {
  let recentPostsTerms = {view: 'new', limit: 10, forum: true, af: true}

  const renderRecentPostsTitle = () => <div className="recent-posts-title-component">
    { currentUser && Users.canDo(currentUser, "posts.alignment.new") &&
      <div className="new-post-link">
        <Link to={{pathname:"/newPost", query: {af: true}}}>
          new post
        </Link>
      </div>
    }
  </div>

  return (
    <div className="alignment-forum-home">
      <Components.Section
        title="Recommended Sequences"
      >
        <Components.SequencesGridWrapper
          terms={{view:"curatedSequences", limit:3}}
          showAuthor={true}
          showLoadMore={false}
          className={classes.frontpageSequencesGridList}
        />
      </Components.Section>
      <Components.Section title="AI Alignment Posts"
        titleComponent={renderRecentPostsTitle()}>
        <Components.PostsList terms={recentPostsTerms} />
      </Components.Section>
      <Components.Section title="Recent Discussion" titleLink="/AllComments">
        <Components.RecentDiscussionThreadsList
          terms={{view: 'afRecentDiscussionThreadsList', limit:6}}
          threadView={"afRecentDiscussionThread"}
        />
      </Components.Section>
    </div>
  )
};

registerComponent('AlignmentForumHome', AlignmentForumHome, withUser, withStyles(styles, {name: "AlignmentForumHome"}));
