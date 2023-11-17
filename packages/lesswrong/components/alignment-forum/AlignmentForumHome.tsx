import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { legacyBreakpoints } from '../../lib/utils/theme';
import AddIcon from '@material-ui/icons/Add';
import { reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';

const styles = (theme: ThemeType): JssStyles => ({
  frontpageSequencesGridList: {
    [legacyBreakpoints.maxSmall]: {
      marginTop: 40,
    }
  }
});

const AlignmentForumHome = ({classes}: {
  classes: ClassesType
}) => {
  const { SingleColumnSection, SectionTitle, FrontpageReviewWidget, PostsList2, SectionButton, RecentDiscussionThreadsList, CuratedSequences } = Components
  const currentUser = useCurrentUser();

  let recentPostsTerms = {view: 'new', limit: 10, forum: true, af: true}

  return (
    <div className="alignment-forum-home">
      <SingleColumnSection>
        <SectionTitle title="Recommended Sequences"/>
        <div className={classes.frontpageSequencesGridList}>
          <CuratedSequences />
        </div>
      </SingleColumnSection>
      {reviewIsActive() && <SingleColumnSection>
        <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
      </SingleColumnSection>}
      <SingleColumnSection>
        <SectionTitle title="AI Alignment Posts">
          { currentUser && userCanDo(currentUser, "posts.alignment.new") && 
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
          commentsLimit={4}
          af={true}
        />
      </SingleColumnSection>
    </div>
  )
};

const AlignmentForumHomeComponent = registerComponent(
  'AlignmentForumHome', AlignmentForumHome, {styles}
);

declare global {
  interface ComponentTypes {
    AlignmentForumHome: typeof AlignmentForumHomeComponent
  }
}
