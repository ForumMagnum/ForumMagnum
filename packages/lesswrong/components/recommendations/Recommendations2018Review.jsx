import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper.js';
import Tooltip from '@material-ui/core/Tooltip';

const Recommendations2018Review = ({settings}) => {
  const { SubSection, SectionSubtitle, RecommendationsList, SectionFooter } = Components

  const reviewTooltip = <div>
    <div>This month, the LessWrong community is reflecting on posts from 2018</div>
    <ul>
      <li>Users with 1000+ karma can nominate posts until</li>
    </ul>
  </div>

  const review2018TopUrl = ""
  const review2018MonthlyUrl = ""

  return (
    <div>
      <Tooltip placement="top-start" title={reviewTooltip}>
        <Link to={"/nominations"}>
          <SectionSubtitle >
            The LessWrong 2018 Review
          </SectionSubtitle>
        </Link>
      </Tooltip>
      <SubSection>
        <RecommendationsList algorithm={{...settings, review2018: true}} showLoginPrompt={false} />
      </SubSection>
      <SectionFooter>
        <Link to={review2018TopUrl}>
          Top 2018 Posts
        </Link>
        <Link to={review2018MonthlyUrl}>
          2018 Posts by Month
        </Link>
      </SectionFooter>
    </div>
  )
}

registerComponent('Recommendations2018Review', Recommendations2018Review);
