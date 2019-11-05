import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper.js';
import { withStyles } from '@material-ui/core/styles';
import withHover from '../common/withHover';

const styles = theme => ({
  root: {
    marginLeft: 4,
    marginRight: 4,
    fontFamily: theme.typography.fontFamily,
    verticalAlign: "middle",
    
    "&:hover": {
      opacity: 1.0,
      
      "& $score": {
        borderColor: "black",
      },
      "& $name": {
        borderColor: "black",
      },
    },
  },
  score: {
    display: "inline-block",
    height: 30,
    paddingTop: 6,
    paddingLeft: 10,
    paddingRight: 6,
    background: "#484",
    border: "1px solid #888",
    borderRight: "none",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    color: "white",
    fontWeight: 600,
  },
  name: {
    display: "inline-block",
    height: 30,
    paddingTop: 6,
    paddingLeft: 6,
    paddingRight: 6,
    border: "1px solid #888",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  hovercard: {
  },
});

const FooterTag = ({tagRel, tag, hover, anchorEl, classes}) => {
  return (<span>
    <Link to={`/tag/${tag.slug}`} className={classes.root}>
      <span className={classes.score}>{tagRel.baseScore}</span>
      <span className={classes.name}>{tag.name}</span>
    </Link>
    <Components.PopperCard open={hover} anchorEl={anchorEl}>
      <div className={classes.hovercard}>
        <Components.TagRelCard tagRel={tagRel}/>
      </div>
    </Components.PopperCard>
  </span>);
}

registerComponent("FooterTag", FooterTag,
  withHover,
  withStyles(styles, {name: "FooterTag"}));
