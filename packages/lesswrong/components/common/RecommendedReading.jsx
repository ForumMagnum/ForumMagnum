import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import Hidden from '@material-ui/core/Hidden';

const styles = theme => ({
  smallScreenRecommendedReading: {
    maxWidth: 720,
    margin: "0 auto",
  },
});


const RecommendedReading = ({currentUser, classes}) => {
  let sectionTitle = currentUser ? "Recommended Sequences" : "Recommended Reading";
  
  let sectionWrapper = recommendedContent => <React.Fragment>
    <Hidden smDown implementation="css">
      <Components.Section
        title={sectionTitle}
        titleLink="/library"
        titleComponent= {<Components.SectionSubtitle to="/library">
          <Link to="/library">Sequence Library</Link>
        </Components.SectionSubtitle>}
      >{recommendedContent}</Components.Section>
    </Hidden>
    <Hidden mdUp implementation="css">
      <div className={classes.smallScreenRecommendedReading}>
        {recommendedContent}
      </div>
    </Hidden>
  </React.Fragment>;
  
  if (currentUser) {
    return sectionWrapper(
      <Components.SequencesGridWrapper
        terms={{view:"curatedSequences", limit:3}}
        showAuthor={true}
        showLoadMore={false}
        className={classes.frontpageSequencesGridList}
      />
    );
  } else {
    return sectionWrapper(
      <Components.CoreReading />
    );
  }
}

registerComponent("RecommendedReading", RecommendedReading, withUser,
  withStyles(styles, {name: "RecommendedReading"}));
