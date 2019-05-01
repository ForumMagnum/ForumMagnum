import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Link, withRouter } from '../../lib/reactRouterWrapper.js';
import withDialog from '../common/withDialog'
class QuestionsPage extends PureComponent {
  render () {
    const { location, openDialog } = this.props
    const { TabNavigationMenu, SingleColumnSection, SectionTitle,  PostsList2, SectionButton } = Components

    const topQuestionsTerms = {
      view: 'topQuestions',
      limit: 5,
    };
  
    const recentActivityTerms = {
      view: 'recentQuestionActivity',
      limit: 12,
      includeRelatedQuestions: location.query.includeRelatedQuestions
    };
  
    return (
      <div>
        <TabNavigationMenu />
        <SingleColumnSection>
          <SectionTitle title="Top Questions"/>
          <PostsList2 terms={topQuestionsTerms}/>
        </SingleColumnSection>
        <SingleColumnSection>
          <SectionTitle title="Recent Activity">
            <SectionButton>
              <span onClick={()=>openDialog({componentName:"NewQuestionDialog"})}>
                New Question
              </span>
            </SectionButton>
          </SectionTitle>
          <PostsList2 terms={recentActivityTerms}>
            <Link to={"/allPosts?filter=questions&view=new"}>View All Questions</Link>
          </PostsList2>
        </SingleColumnSection>
      </div>
  
    )
  }
}

registerComponent('QuestionsPage', QuestionsPage, withRouter, withDialog);
