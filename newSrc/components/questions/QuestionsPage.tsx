import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { withLocation } from '../../lib/routeUtil';
import withDialog from '../common/withDialog'
import { useCurrentUser } from '../common/withUser'
import AddBoxIcon from '@material-ui/icons/AddBox'

const QuestionsPage = ({ openDialog, location }) => {
  const currentUser = useCurrentUser();
  const { query } = location;
  const { SingleColumnSection, SectionTitle,  PostsList2, SectionButton, LWTooltip } = Components

  const topQuestionsTerms = {
    view: 'topQuestions',
    limit: 5,
  };

  const recentActivityTerms = {
    view: 'recentQuestionActivity',
    limit: 12,
    includeRelatedQuestions: query.includeRelatedQuestions
  };

  return (
    <div>
      <SingleColumnSection>
        <SectionTitle title="Top Questions"/>
        <PostsList2 terms={topQuestionsTerms}>
          <LWTooltip title="View all questions, sorted by karma">
            <Link to={"/allPosts?filter=questions&sortedBy=top&timeframe=allTime"}>View All Top Questions</Link>
          </LWTooltip>
        </PostsList2>
      </SingleColumnSection>
      <SingleColumnSection>
        <SectionTitle title="Recent Activity">
          {currentUser && <span onClick={()=>openDialog({componentName:"NewQuestionDialog"})}>
            <SectionButton>
              <AddBoxIcon />
              New Question
            </SectionButton>
          </span>}
        </SectionTitle>
        <PostsList2 terms={recentActivityTerms}>
          <LWTooltip title="View all questions, sorted by 'newest first'">
            <Link to={"/allPosts?filter=questions&sortedBy=new&timeframe=allTime"}>View All Questions</Link>
          </LWTooltip>
        </PostsList2>
      </SingleColumnSection>
    </div>
  )
}

const QuestionsPageComponent = registerComponent('QuestionsPage', QuestionsPage, {
  hocs: [withDialog, withLocation]
});

declare global {
  interface ComponentTypes {
    QuestionsPage: typeof QuestionsPageComponent
  }
}

