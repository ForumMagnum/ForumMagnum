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
    height: 26,
    paddingTop: 5,
    paddingLeft: 10,
    paddingRight: 6,
    background: "#484",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    color: "white",
    fontWeight: 400,
    verticalAlign: "middle",
  },
  name: {
    display: "inline-block",
    height: 26,
    paddingTop: 2,
    paddingLeft: 8,
    paddingRight: 10,
    border: "1px solid #888",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    ...theme.typography.postStyle,
    verticalAlign: "middle",
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
