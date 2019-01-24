import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import Hidden from '@material-ui/core/Hidden';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
  section: {
    [theme.breakpoints.down('sm')]: {
      marginTop: -15,
    },
  },
  curatedTitle: {
    fontFamily: theme.typography.postStyle.fontFamily
  },
  smallScreenRecommendedReading: {
    maxWidth: 720,
    margin: "0 auto",
  },
});


const RecommendedReading = ({currentUser, classes}) => {
  const { SingleColumnSection, SectionTitle } = Components
  const sectionTitle = currentUser ? "Recommended Sequences" : "Recommended Reading";
  
  const sectionWrapper = (recommendedContent) => (
    <SingleColumnSection >
      <Typography variant="display1" className={classes.curatedTitle}>
        { sectionTitle }
      </Typography>
      {recommendedContent}
    </SingleColumnSection>
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
      <Hidden xsDown implementation="css">
        {sectionWrapper(
          suggestedSequences(3)
        )}
      </Hidden>
      <Hidden smUp implementation="css">
        {sectionWrapper(
          suggestedSequences(1)
        )}
      </Hidden>
    </React.Fragment>);
  } else {
    return (<React.Fragment>
      {sectionWrapper(
        <Components.CoreReading />
      )}
    </React.Fragment>);
  }
}

registerComponent("RecommendedReading", RecommendedReading, withUser,
  withStyles(styles, {name: "RecommendedReading"}));
