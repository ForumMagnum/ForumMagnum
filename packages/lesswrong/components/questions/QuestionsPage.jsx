import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Link, withRouter } from '../../lib/reactRouterWrapper.js';
import withDialog from '../common/withDialog'
import withUser from '../common/withUser'
import AddBoxIcon from '@material-ui/icons/AddBox'
class QuestionsPage extends PureComponent {

  render () {
    const { currentUser, location, openDialog } = this.props
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
        {/*<TabNavigationMenu />*/}
        <SingleColumnSection>
          <SectionTitle title="Top Questions"/>
          <PostsList2 terms={topQuestionsTerms}/>
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
            <Link to={"/allPosts?filter=questions&view=new"}>View All Questions</Link>
          </PostsList2>
        </SingleColumnSection>
      </div>
  
    )
  }
}

registerComponent('QuestionsPage', QuestionsPage, withRouter, withDialog, withUser);
