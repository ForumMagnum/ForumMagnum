import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { legacyBreakpoints } from '../../lib/utils/theme';

export const postsItemLikeStyles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.postStyle,
    position: "relative",
    display: "flex",
    padding: theme.spacing.unit*1.5,
    alignItems: "center",
    flexWrap: "nowrap",
    background: theme.palette.panelBackground.default,
    borderBottom: theme.palette.border.itemSeparatorBottom,
    [theme.breakpoints.down('sm')]: {
      flexWrap: "wrap",
    },
    [legacyBreakpoints.maxTiny]: {
      marginLeft: 0,
      paddingLeft: 0,
    },
    "& a:hover": {
      textDecoration: "none",
      color: theme.palette.link.dim3,
    },
    '&:hover $actions': {
      opacity: .2,
    }
  },
  title: {
    fontSize: "1.4rem",
    lineHeight: "1.4rem",
    fontWeight: 400,
    overflow: "hidden",
    textOverflow: "ellipsis",
    textDecoration: "none",
    whiteSpace: "nowrap",
    flexGrow: 1,
    marginRight: theme.spacing.unit * 2,
    [theme.breakpoints.down('sm')]: {
      width: "100%",
      marginBottom: theme.spacing.unit*1.5
    }
  },
  actions: {
    opacity: 0,
    display: "flex",
    position: "absolute",
    top: 0,
    right: -18,
    width: 18,
    height: "100%",
    cursor: "pointer",
    alignItems: "center",
    justifyContent: "center",
    '&:hover': {
      opacity: 1
    },
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
})

const styles = (theme: ThemeType) => ({
  ...postsItemLikeStyles(theme),
  location: {
    color: theme.palette.text.dim40,
    marginRight: 8,
  },
  links: {
    minWidth: 132,
  }
});

const LocalGroupsItem = ({group, classes}: {
  group: localGroupsHomeFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsItemMetaInfo, GroupLinks } = Components
  
  if (!group) { return null }

  return (
    <div className={classes.root}>
      <Link to={`/groups/${group._id}`}  className={classes.title}>{group.name}</Link>
      <div  className={classes.location}>
        <PostsItemMetaInfo>{ group.location }</PostsItemMetaInfo>
      </div>
      <div className={classes.links}>
        <GroupLinks document={group} />
      </div>
    </div>
  )
}

const LocalGroupsItemComponent = registerComponent('LocalGroupsItem', LocalGroupsItem, {styles});

declare global {
  interface ComponentTypes {
    LocalGroupsItem: typeof LocalGroupsItemComponent
  }
}

