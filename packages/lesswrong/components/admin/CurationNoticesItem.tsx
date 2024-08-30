// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { isFriendlyUI } from '@/themes/forumTheme';
import { commentBodyStyles } from '../../themes/stylePiping'

const styles = (theme: ThemeType) => ({
  root: {
    border: theme.palette.border.commentBorder,
    borderRadius: isFriendlyUI ? theme.borderRadius.small : undefined,
    cursor: "default",
    marginBottom: 20,
    background: theme.palette.background.pageActiveAreaBackground,
    padding: 12,
    position: "relative",
    paddingBottom: 24,
  },
  editButton: {
    ...commentBodyStyles(theme),
    color: theme.palette.primary.main,
    padding: "0px 16px",
    fontSize: "16px",
    position: "absolute",
    right: 10,
    top: 10,
    textTransform: "uppercase",
},
  publishButton: {
      ...commentBodyStyles(theme),
      color: theme.palette.primary.main,
      padding: "0px 16px",
      fontSize: "16px",
      position: "absolute",
      right: 10,
      bottom: 10,
      textTransform: "uppercase",
  },
  meta: {
    "& > div": {
      marginRight: 5,
    },
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    rowGap: "6px",
    marginBottom: 8,
    color: theme.palette.text.dim,
    paddingTop: "0.6em",
    marginRight: isFriendlyUI ? 40 : 20,

    "& a:hover, & a:active": {
      textDecoration: "none",
      color: isFriendlyUI ? undefined : `${theme.palette.linkHover.dim} !important`,
    },
  },
  postTitle: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.link.dim2,
  },
  username: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontWeight: 600,
    marginLeft: 25,
  },
  rightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  commentBody: {
    ...commentBodyStyles(theme)
  }
});

const { ContentItemBody, Button } = Components;

export const CurationNoticesItem = ({curationNotice, classes}: {
  curationNotice: CurationNoticesFragment,
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  return <div className={classes.root}>
    <div className={classes.meta}>
      <div>
        <span className={classes.postTitle}>{curationNotice.post?.title}</span>
        <span className={classes.username}>Curation by {curationNotice.user?.displayName}</span>
      </div>
    </div>
    <div
      onClick={() => console.log("click")}
      className={classes.editButton}
      >
      Edit
    </div>
    <ContentItemBody dangerouslySetInnerHTML={{__html: curationNotice.contents?.html ?? ''}} className={classes.commentBody}/>
    <div
      onClick={() => console.log("click")}
      className={classes.publishButton}
      >
      Publish
    </div>
  </div>
}

const CurationNoticesItemComponent = registerComponent('CurationNoticesItem', CurationNoticesItem, {styles});

declare global {
  interface ComponentTypes {
    CurationNoticesItem: typeof CurationNoticesItemComponent
  }
}
