import Button from '@material-ui/core/Button';
import React, { useCallback, useEffect } from 'react';
import { RSVPType } from '../../../lib/collections/posts/schema';
import { useLocation } from '../../../lib/routeUtil';
import { useDialog } from '../../common/withDialog';
import { useCurrentUser } from '../../common/withUser';
import { responseToText, RsvpResponse } from './RSVPForm';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { gql, useMutation } from '@apollo/client';
import { isFriendlyUI } from '../../../themes/forumTheme';
import groupBy from "lodash/groupBy";
import mapValues from "lodash/mapValues";
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from "../../../lib/vulcan-lib/fragments";

const styles = (theme: ThemeType) => ({
  body: {
    marginBottom: 48
  },
  rsvpItem: {
    width:  isFriendlyUI ? "33%" : "25%",
    display: "inline-block",
    marginRight: 16,
    paddingTop: 4,
    paddingBottom: 4,
    padding: 8,
    verticalAlign: "top",
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    [theme.breakpoints.down('sm')]: {
      width: "33.3%"
    },
    [theme.breakpoints.down('xs')]: {
      width: "50%"
    }
  },
  response: {
    marginTop: -4,
    ...theme.typography.smallText
  },
  rsvpBlock: {
    marginTop: 10,
    marginBottom: 10
  },
  rsvpCounts: {
    marginTop: 10,
    marginBottom: 10,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
  },
  rsvpCount: {
    marginLeft: 10,
  },
  buttons: {
    [theme.breakpoints.down('xs')]: {
      display: "block"
    },
  },
  button: {},
  goingButton: {
    color: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    marginRight: 8
  },
  maybeButton: {
    color: theme.palette.text.eventMaybe,
    borderColor: theme.palette.text.eventMaybe,
    marginRight: 8
  },
  cantGoButton: {
    color: theme.palette.grey[800]
  },
  email: {
    ...theme.typography.smallText,
    color: theme.palette.text.dim3,
    marginLeft: 24
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
  },
  rsvpMessage: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }
    : {
      fontStyle: "italic",
    },
});

const RSVPs = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType<typeof styles>
}) => {
  const { ResponseIcon, ContentStyles } = Components;
  const { openDialog } = useDialog()
  const { query } = useLocation()
  const currentUser = useCurrentUser()
  const openRSVPForm = useCallback((initialResponse: string) => {
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
  const cancelRSVP = async (rsvp: RSVPType) => await cancelMutation({variables: {postId: post._id, name: rsvp.name, userId: rsvp.userId}})

  const rsvpCounts: Partial<Record<RsvpResponse,number>> = mapValues(groupBy(post.rsvps, rsvp => rsvp.response), rsvps=>rsvps.length);

  return <ContentStyles contentType="post" className={classes.body}>
    <div className={classes.topRow}>
      <span className={classes.rsvpMessage}>
        The host has requested RSVPs for this event
      </span>
      <span className={classes.buttons}>
        <Button color="primary" variant="outlined" className={classes.goingButton} onClick={() => openRSVPForm("yes")}>
          <ResponseIcon response="yes" /> Going
        </Button>
        <Button variant="outlined" className={classes.maybeButton} onClick={() => openRSVPForm("maybe")}>
          <ResponseIcon response="maybe" /> Maybe
        </Button>
        <Button variant="outlined" className={classes.button} onClick={() => openRSVPForm("no")}>
          <ResponseIcon response="no" /> Can't Go
        </Button>
      </span>
    </div>
    {post.isEvent && post.rsvps?.length > 0 && <>
      <div className={classes.rsvpCounts}>
        {Object.keys(responseToText).map((response: RsvpResponse) => <span key={response} className={classes.rsvpCount}>
          <ResponseIcon response={response} />
          {rsvpCounts[response]??0} {responseToText[response]}
        </span>)}
      </div>
      <div className={classes.rsvpBlock}>
        {post.rsvps.map((rsvp: RSVPType) => {
          const canCancel = currentUser?._id === post.userId || currentUser?._id === rsvp.userId
          return <span className={classes.rsvpItem} key={`${rsvp.name}-${rsvp.response}`}>
            <div>
              <ResponseIcon response={rsvp.response}/>
              <span className={classes.rsvpName}>{rsvp.name}</span>
              {canCancel && <span className={classes.remove} onClick={() => cancelRSVP(rsvp)}>
                {"x"}
              </span>}
            </div>
            {currentUser?._id === post.userId && <div className={classes.email}>
              {rsvp.email}
            </div>}
        </span>
        })}
      </div>
    </>}
  </ContentStyles>;
}

const responseIconStyles = (theme: ThemeType) => ({
  goingIcon: {
    height: 14,
    color: theme.palette.primary.main
  },
  maybeIcon: {
    height: 14,
    color: theme.palette.text.eventMaybe
  },
  noIcon: {
    height: 14,
    color: theme.palette.grey[500]
  },
});

function ResponseIcon({response, classes}: {
  response: RsvpResponse
  classes: ClassesType<typeof responseIconStyles>
}) {
  switch (response) {
    case "yes":
      return <CheckCircleOutlineIcon className={classes.goingIcon} />
    case "maybe":
      return <HelpOutlineIcon className={classes.maybeIcon} />
    case "no":
      return <HighlightOffIcon className={classes.noIcon} />
    default:
      return <></>
  }
}

const RSVPsComponent = registerComponent('RSVPs', RSVPs, {styles});
const ResponseIconComponent = registerComponent('ResponseIcon', ResponseIcon, {styles: responseIconStyles});

declare global {
  interface ComponentTypes {
    RSVPs: typeof RSVPsComponent
    ResponseIcon: typeof ResponseIconComponent
  }
}
