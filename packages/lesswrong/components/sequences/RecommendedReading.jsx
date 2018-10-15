import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    position: "relative"
  },
  
  nextSequenceDirection: {
    fontWeight: 600,
    fontSize: "1.2rem",
  },
  
  clear: {
    clear: "both"
  }
});

const RecommendedReading = ({sequence, chapter, post, previousPost, nextPost, nextTitle, nextLink, collectionTitle, classes}) => {
  return <div className={classes.root}>
    {(previousPost && sequence) ? <div className="sequences-navigation-bottom-previous-post">
      <Components.RecommendedReadingItem direction="Previous" post={previousPost} sequence={sequence}/>
    </div> : null}
    <div className="sequences-navigation-bottom-divider"></div>
    { nextTitle ?
      <div className="sequences-navigation-bottom-next-sequence">
        <Link className="sequences-navigation-next-sequence" to={nextLink || post.nextPageLink}>
          <div className={classes.nextSequenceDirection}>Next Sequence:</div> {nextTitle || post.nextPageTitle}
        </Link>
      </div>
    : (
      (nextPost && sequence) ? <div className="sequences-navigation-bottom-next-post">
        <Components.RecommendedReadingItem direction="Next" post={nextPost} sequence={sequence}/>
      </div> : null
    ) }
    <div className={classes.clear}></div>
  </div>
};


registerComponent('RecommendedReading', RecommendedReading,
  withRouter, withStyles(styles, {name: "RecommendedReading"}));
