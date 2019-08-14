import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import Users from "meteor/vulcan:users";
import withUser from '../common/withUser';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';

const styles = theme => ({
  frontpageSequencesGridList: {
    [legacyBreakpoints.maxSmall]: {
      marginTop: 40,
    }
  }
});

const AlignmentForumHome = ({currentUser, classes}) => {
  const { SingleColumnSection, SectionTitle, SequencesGridWrapper, PostsList2, SectionButton, RecentDiscussionThreadsList } = Components

  let recentPostsTerms = {view: 'new', limit: 10, forum: true, af: true}

  return (
    <div className="alignment-forum-home">
      <SingleColumnSection>
        <SectionTitle title="Recommended Sequences"/>
        <SequencesGridWrapper
            terms={{view:"curatedSequences", limit:3}}
            showAuthor={true}
            showLoadMore={false}
            className={classes.frontpageSequencesGridList}
          />
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="AI Alignment Posts">
          { currentUser && Users.canDo(currentUser, "posts.alignment.new") && 
            <Link to={{pathname:"/newPost", search: `?af=true`}}>
              <SectionButton>
                <AddIcon />
                New Post
              </SectionButton>
            </Link>
          }
        </SectionTitle>
        <PostsList2 terms={recentPostsTerms} />
      </SingleColumnSection>
      <SingleColumnSection>
        <RecentDiscussionThreadsList
          terms={{view: 'afRecentDiscussionThreadsList', limit:6}}
          maxAgeHours={24*7}
          af={true}
        />
      </SingleColumnSection>
    </div>
  )
};

registerComponent('AlignmentForumHome', AlignmentForumHome, withUser, withStyles(styles, {name: "AlignmentForumHome"}));
