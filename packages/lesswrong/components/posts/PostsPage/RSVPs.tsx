import Button from '@material-ui/core/Button';
import React, { useCallback, useEffect } from 'react';
import { RSVPType } from '../../../lib/collections/posts/schema';
import { useLocation } from '../../../lib/routeUtil';
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { responseToText } from './RSVPForm';
import { forumTypeSetting } from '../../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  body: {
    marginBottom: 12
  },
  rsvpItem: {
    width:  forumTypeSetting.get() === "EAForum" ? "33%" : "25%",
    display: "inline-block",
    paddingTop: 4,
    paddingBottom: 4,
    padding: 8,
    verticalAlign: "top",
    [theme.breakpoints.down('sm')]: {
      width: "33.3%"
    },
    [theme.breakpoints.down('xs')]: {
      width: "50%"
    }
  },
  response: {
    marginTop: -4
  },
  email: {
    marginTop: -4,
    fontSize: "1rem",
    color: theme.palette.text.slightlyDim2,
  },
  rsvpBlock: {
    marginTop: 10, 
    marginBottom: 10
  }, 
  buttons: {
    [theme.breakpoints.down('xs')]: {
      display: "block"
    },
  },
  button: {

  }, 
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    [theme.breakpoints.down('xs')]: {
      display: "block"
    },
  }
});

const RSVPs = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType
}) => {
  const { ContentStyles } = Components;
  const { openDialog } = useDialog()
  const { query } = useLocation()
  const currentUser = useCurrentUser()
  const openRSVPForm = useCallback((initialResponse) => {
    openDialog({
      componentName: "RSVPForm",
      componentProps: { post, initialResponse }
    })
  }, [post, openDialog])
  useEffect(() => {
    if(query.rsvpDialog) {
      openRSVPForm("yes")
    }
  })
  return <ContentStyles contentType="post" className={classes.body}>
    <div className={classes.topRow}>
      <i>The host has requested RSVPs for this event</i>
      <span className={classes.buttons}>
        <Button color="primary" className={classes.button} onClick={() => openRSVPForm("yes")}>Going</Button>
        <Button className={classes.button} onClick={() => openRSVPForm("maybe")}>Maybe</Button>
        <Button className={classes.button} onClick={() => openRSVPForm("no")}>Can't Go</Button>
      </span>
    </div>
    {post.isEvent && post.rsvps?.length > 0 && <div className={classes.rsvpBlock}>
      {post.rsvps.map((rsvp:RSVPType) => <span className={classes.rsvpItem} key={`${rsvp.name}-${rsvp.response}`}>
        <div>{rsvp.name}</div>
        <ContentStyles contentType="comment" className={classes.response}>
          {responseToText[rsvp.response]}
        </ContentStyles>
        {currentUser?._id === post.userId &&
          <ContentStyles contentType="comment" className={classes.email}>{rsvp.email}</ContentStyles>}
      </span>)}
    </div>}
  </ContentStyles>;
}

const RSVPsComponent = registerComponent('RSVPs', RSVPs, {styles});

declare global {
  interface ComponentTypes {
    RSVPs: typeof RSVPsComponent
  }
}
