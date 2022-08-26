import Button from '@material-ui/core/Button';
import React, { useCallback, useEffect } from 'react';
import { RSVPType } from '../../../lib/collections/posts/schema';
import { useLocation } from '../../../lib/routeUtil';
import { registerComponent, Components, getFragment } from '../../../lib/vulcan-lib';
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { responseToText } from './RSVPForm';
import { forumTypeSetting } from '../../../lib/instanceSettings';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { gql, useMutation } from '@apollo/client';

const styles = (theme: ThemeType): JssStyles => ({
  body: {
    marginBottom: 12
  },
  rsvpItem: {
    // width:  forumTypeSetting.get() === "EAForum" ? "33%" : "25%",
    display: "inline-block",
    marginRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    padding: 8,
    verticalAlign: "top",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    // [theme.breakpoints.down('sm')]: {
    //   width: "33.3%"
    // },
    // [theme.breakpoints.down('xs')]: {
    //   width: "50%"
    // }
  },
  response: {
    marginTop: -4,
    ...theme.typography.smallText
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
  goingButton: {
    color: theme.palette.primary.main
  },
  goingIcon: {
    height: 12,
    color: theme.palette.primary.main
  },
  maybeButton: {
    color: theme.palette.text.eventMaybe
  },
  maybeIcon: {
    height: 12,
    color: theme.palette.text.eventMaybe
  },
  cantGoButton: {
    color: theme.palette.grey[800]
  },
  cantGoIcon: {
    height: 12,
  },
  remove: {
    color: theme.palette.grey[500],
    marginLeft: 12,
    cursor: "pointer",
    position: "relative",
    top: -2
  },
  rsvpName: {
    position: "relative",
    top: -1
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
  const { ContentStyles, LWTooltip } = Components;
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
  const [cancelMutation] = useMutation(gql`
    mutation CancelRSVPToEvent($postId: String, $name: String, $userId: String) {
        CancelRSVPToEvent(postId: $postId, name: $name, userId: $userId) {
        ...PostsDetails
        }
    }
    ${getFragment("PostsDetails")}
  `)
  const cancelRSVP = async (rsvp) => await cancelMutation({variables: {postId: post._id, name: rsvp.name, userId: rsvp.userId}})

  return <ContentStyles contentType="post" className={classes.body}>
    <div className={classes.topRow}>
      <i>The host has requested RSVPs for this event</i>
      <span className={classes.buttons}>
        <Button color="primary" className={classes.goingButton} onClick={() => openRSVPForm("yes")}>
          Going <CheckCircleOutlineIcon className={classes.goingIcon} />
        </Button>
        <Button className={classes.maybeButton} onClick={() => openRSVPForm("maybe")}>
          Maybe <HelpOutlineIcon className={classes.maybeIcon} />
        </Button>
        <Button className={classes.button} onClick={() => openRSVPForm("no")}>
          Can't Go
        </Button>
      </span>
    </div>
    {post.isEvent && post.rsvps?.length > 0 && 
      <div className={classes.rsvpBlock}>
        {post.rsvps.map((rsvp:RSVPType) => {
          const canCancel = currentUser?._id === post.userId || currentUser?._id === rsvp.userId
          return <span className={classes.rsvpItem} key={`${rsvp.name}-${rsvp.response}`}>
          <LWTooltip title={<div>
            {responseToText[rsvp.response]}
            {currentUser?._id === post.userId && <p>{rsvp.email}</p>}
          </div>}>
            <div>
              {responseToText[rsvp.response] === "Going" && <CheckCircleOutlineIcon className={classes.goingIcon} />}
              {responseToText[rsvp.response] === "Maybe" && <HelpOutlineIcon className={classes.maybeIcon} />}
              <span className={classes.rsvpName}>{rsvp.name}</span>
                  {canCancel && <span className={classes.remove} onClick={() => cancelRSVP(rsvp)}>
                    x
                  </span>}
            </div>
          </LWTooltip>
        </span>
        })}
      </div>
    }
  </ContentStyles>;
}

const RSVPsComponent = registerComponent('RSVPs', RSVPs, {styles});

declare global {
  interface ComponentTypes {
    RSVPs: typeof RSVPsComponent
  }
}
