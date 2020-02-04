import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Link } from '../../lib/reactRouterWrapper';
import { withStyles } from '@material-ui/core/styles';
import withHover from '../common/withHover';

const styles = theme => ({
  root: {
    marginRight: 4,
    paddingTop: 5,
    paddingBottom: 5,
    ...theme.typography.commentStyle,
    "&:hover": {
      opacity: 1
    },
  },
  score: {
    display: "inline-block",
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 5,
    paddingBottom: 5,
    background: "rgba(100,170,110,1)",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    color: "white",
    fontWeight: 400,
    border: "1px solid #aaa",
  },
  name: {
    display: "inline-block",
    paddingLeft: 8,
    paddingRight: 10,
    paddingTop: 5,
    paddingBottom: 5,
    border: "1px solid #aaa",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderLeft: "none"
  },
  hovercard: {
  },
});

const FooterTag = ({tagRel, tag, hover, anchorEl, classes}) => {
  return (<span className={classes.root}>
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
  withHover(),
  withStyles(styles, {name: "FooterTag"}));
