import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { legacyBreakpoints } from '../../lib/utils/theme';
import withErrorBoundary from '../common/withErrorBoundary'
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

const BottomNavigation = ({post, classes}: {
  post: PostSequenceNavigation,
  classes: ClassesType,
}) => {
  const { nextPost, prevPost } = post;
  
  if (!nextPost && !prevPost)
    return null;
  
  return <div className={classes.root}>
    {prevPost &&
      <div className={classnames(classes.post, classes.prevPost)}>
      <Components.BottomNavigationItem direction="Previous" post={prevPost} sequence={prevPost.sequence}/>
      </div>}
    
    <div className={classes.divider}></div>
    
    {nextPost &&
      <div className={classnames(classes.post, classes.nextPost)}>
        <Components.BottomNavigationItem direction="Next" post={nextPost} sequence={nextPost.sequence}/>
      </div>}
    
    <div className={classes.clear}></div>
  </div>
};


const BottomNavigationComponent = registerComponent('BottomNavigation', BottomNavigation, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    BottomNavigation: typeof BottomNavigationComponent
  }
}

