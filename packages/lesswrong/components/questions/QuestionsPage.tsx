import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useDialog } from '../common/withDialog'
import { useCurrentUser } from '../common/withUser'
import AddBoxIcon from '@material-ui/icons/AddBox'
import {userCanPost} from "../../lib/collections/posts";

const QuestionsPage = () => {
  const currentUser = useCurrentUser();
  const { query } = useLocation();
  const { openDialog } = useDialog();
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
          {currentUser && <Link to={'/newPost?question=true'}>
            <SectionButton>
              <AddBoxIcon />
              New Question
            </SectionButton>
          </Link>}
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

const QuestionsPageComponent = registerComponent('QuestionsPage', QuestionsPage);

declare global {
  interface ComponentTypes {
    QuestionsPage: typeof QuestionsPageComponent
  }
}

