import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';
import { legacyBreakpoints } from '../../lib/modules/utils/theme';

const styles = theme => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    fontSize: 14,
    paddingLeft: theme.spacing.unit,
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    borderBottom: "solid 1px rgba(0,0,0,.1)",
    [legacyBreakpoints.maxTiny]: {
        marginLeft: 0,
        paddingLeft: 0,
    },
  
    "& a:hover": {
      textDecoration: "none",
      color: "rgba(0,0,0,.4)",
    },
  },
  title: {
    fontSize: "1.4rem",
    lineHeight: "1.4rem",
    fontWeight: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textDecoration: "none",
    whiteSpace: "nowrap",
    zIndex: "400 !important",
    flexGrow: 1,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      marginBottom: theme.spacing.unit*1.5
    }
  },
  location: {
    color: "rgba(0,0,0,.4)",
    marginRight: 8,
  },
  links: {
    minWidth: 132,
  }
});

const LocalGroupsItem = ({group, classes}) => {
  const { PostsItemMetaInfo, GroupLinks } = Components
  
  if (!group) { return null }

  return (
    <div className={classes.root}>
      <Link to={"groups/" + group._id}  className={classes.title}>{group.name}</Link>
      <div  className={classes.location}>
        <PostsItemMetaInfo>{ group.location }</PostsItemMetaInfo>
      </div>
      <div className={classes.links}>
        <GroupLinks document={group} />
      </div>    
    </div>
  )
}

registerComponent('LocalGroupsItem', LocalGroupsItem,
  withStyles(styles, {name: "LocalGroupsItem"}))
