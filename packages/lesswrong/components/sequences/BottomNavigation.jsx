import { Components, registerComponent } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';
import classnames from 'classnames';

const styles = theme => ({
  root: {
    position: "relative"
  },

  post: {
    width: 300,
    display: "inline-block",
    marginTop: -15,
    paddingBottom: 55,

    [legacyBreakpoints.maxSmall]: {
      width: "100%",
      textAlign: "left",
      paddingLeft: 25,
      paddingBottom: 10,
    },
    [legacyBreakpoints.maxTiny]: {
      paddingLeft: 5,
    }
  },

  prevPost: {
  },

  nextPost: {
    float: "right",

    [legacyBreakpoints.maxSmall]: {
      paddingBottom: 50
    }
  },

  divider: {
    position: "absolute",
    height: "110px",
    marginTop: "10px",
    marginLeft: "auto",
    marginRight: "auto",
    width: "0px",
    borderLeftStyle: "solid",
    borderLeftWidth: "1px",
    color: "rgba(0,0,0,0.3)",
    left: 0,
    right: 0,
    top: 0,

    [legacyBreakpoints.maxSmall]: {
      display: "none"
    }
  },

  nextSequenceDirection: {
    fontWeight: 600,
    fontSize: "1.2rem",
  },

  clear: {
    clear: "both"
  }
})

const BottomNavigation = ({sequence, chapter, post, previousPost, nextPost, nextTitle, nextLink, collectionTitle, classes}) => {
  if (nextPost || previousPost) {
    return <div className={classes.root}>
      {(previousPost && sequence) ? <div className={classnames(classes.post, classes.prevPost)}>
        <Components.BottomNavigationItem direction="Previous" post={previousPost} sequence={sequence}/>
      </div> : null}
      <div className={classes.divider}></div>
      {/* TODO: This is currently unreachable (nextTitle is never passed). Hook it up, test the styles, then JSS-ify them. */}
      {/*nextTitle ?
        <div className="sequences-navigation-bottom-next-sequence">
          <Link className="sequences-navigation-next-sequence" to={nextLink || post.nextPageLink}>
            <div className={classes.nextSequenceDirection}>Next Sequence:</div> {nextTitle || post.nextPageTitle}
          </Link>
        </div>
      :*/}
      {
        (nextPost && sequence) ? <div className={classnames(classes.post, classes.nextPost)}>
          <Components.BottomNavigationItem direction="Next" post={nextPost} sequence={sequence}/>
        </div> : null
      }
      <div className={classes.clear}></div>
    </div>
  } else {
    return null
  }
};


registerComponent('BottomNavigation', BottomNavigation,
  withRouter, withStyles(styles, {name: "BottomNavigation"}));
