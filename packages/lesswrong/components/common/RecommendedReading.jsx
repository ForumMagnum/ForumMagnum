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
  const sectionTitle = currentUser ? "Recommended Sequences" : "Recommended Reading";
  
  const sectionWrapper = (recommendedContent) => (
    <Components.Section
      title={sectionTitle}
      titleLink="/library"
      titleComponent= {<Components.SectionSubtitle to="/library">
        <Link to="/library">Sequence Library</Link>
      </Components.SectionSubtitle>}
    >{recommendedContent}</Components.Section>
  );
  
  const omittedSectionWrapper = (content) => (
    <div className={classes.smallScreenRecommendedReading}>
      {content}
    </div>
  );
  
  if (currentUser) {
    const suggestedSequences = count => (
      <Components.SequencesGridWrapper
        terms={{view:"curatedSequences", limit: count}}
        showAuthor={true}
        showLoadMore={false}
        className={classes.frontpageSequencesGridList}
      />
    );
    
    return (<React.Fragment>
      <Hidden smDown implementation="css">
        {sectionWrapper(
          suggestedSequences(3)
        )}
      </Hidden>
      <Hidden mdUp xsDown implementation="css">
        {omittedSectionWrapper(
          suggestedSequences(3)
        )}
      </Hidden>
      <Hidden smUp implementation="css">
        {omittedSectionWrapper(
          suggestedSequences(1)
        )}
      </Hidden>
    </React.Fragment>);
  } else {
    return (<React.Fragment>
      sectionWrapper(
        <Components.CoreReading />
      )
    </React.Fragment>);
  }
}

registerComponent("RecommendedReading", RecommendedReading, withUser,
  withStyles(styles, {name: "RecommendedReading"}));
