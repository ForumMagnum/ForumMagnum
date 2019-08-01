import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withLocation } from '../../lib/routeUtil';
import withDialog from '../common/withDialog'
import withUser from '../common/withUser'
import AddBoxIcon from '@material-ui/icons/AddBox'
class QuestionsPage extends PureComponent {

  render () {
    const { currentUser, openDialog } = this.props
    const { query } = this.props.location;
    const { SingleColumnSection, SectionTitle,  PostsList2, SectionButton } = Components

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

registerComponent('QuestionsPage', QuestionsPage, withDialog, withUser, withLocation);
