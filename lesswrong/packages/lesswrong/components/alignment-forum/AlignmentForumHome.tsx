import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { legacyBreakpoints } from '../../lib/utils/theme';
import AddIcon from '@material-ui/icons/Add';
import { reviewIsActive, REVIEW_YEAR } from '../../lib/reviewUtils';
import SingleColumnSection from "@/components/common/SingleColumnSection";
import { SectionTitle } from "@/components/common/SectionTitle";
import FrontpageReviewWidget from "@/components/review/FrontpageReviewWidget";
import PostsList2 from "@/components/posts/PostsList2";
import SectionButton from "@/components/common/SectionButton";
import RecentDiscussionThreadsList from "@/components/recentDiscussion/RecentDiscussionThreadsList";
import EAPopularCommentsSection from "@/components/ea-forum/EAPopularCommentsSection";
import RotatingReviewWinnerSpotlight from "@/components/review/RotatingReviewWinnerSpotlight";

const styles = (theme: ThemeType) => ({
  frontpageSequencesGridList: {
    [legacyBreakpoints.maxSmall]: {
      marginTop: 40,
    }
  }
});

const AlignmentForumHome = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser();

  let recentPostsTerms = {view: 'new', limit: 10, forum: true, af: true} as const;

  return (
    <div className="alignment-forum-home">
      <SingleColumnSection>
        <RotatingReviewWinnerSpotlight />
      </SingleColumnSection>

      {reviewIsActive() && <SingleColumnSection>
        <FrontpageReviewWidget reviewYear={REVIEW_YEAR}/>
      </SingleColumnSection>}
      <SingleColumnSection>
        <SectionTitle title="AI Alignment Posts">
          { currentUser && userCanDo(currentUser, "posts.alignment.new") && 
            <Link to={"/newPost?af=true"}>
              <SectionButton>
                <AddIcon />
                New Post
              </SectionButton>
            </Link>
          }
        </SectionTitle>
        <PostsList2 terms={recentPostsTerms} />
      </SingleColumnSection>
      <EAPopularCommentsSection />
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

export default AlignmentForumHomeComponent;
