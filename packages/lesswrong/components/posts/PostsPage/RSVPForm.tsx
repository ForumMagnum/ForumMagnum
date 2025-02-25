import React, { useState } from 'react';
import DialogContent from '@material-ui/core/DialogContent';
import { gql, useMutation } from '@apollo/client';
import Input from '@material-ui/core/Input';
import DialogTitle from '@material-ui/core/DialogTitle';
import Select from '@material-ui/core/Select';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useNavigate } from '../../../lib/routeUtil';
import { Components, registerComponent } from "../../../lib/vulcan-lib/components";
import { getFragment } from "../../../lib/vulcan-lib/fragments";

export type RsvpResponse = "yes"|"maybe"|"no";
export const responseToText: Record<RsvpResponse,string> = {
  yes: "Going",
  maybe: "Maybe",
  no: "Can't Go"
}

const styles = (theme: ThemeType) => ({
  emailMessage: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
    }
    : {
      fontStyle: "italic",
    },
});

const RSVPForm = ({ post, onClose, initialResponse = "yes", classes }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  initialResponse: string,
  onClose?: () => void,
  classes: ClassesType<typeof styles>,
}) => {
  const [registerRSVP] = useMutation(gql`
    mutation RegisterRSVP($postId: String, $name: String, $email: String, $private: Boolean, $response: String) {
        RSVPToEvent(postId: $postId, name: $name, email: $email, private: $private, response: $response) {
        ...PostsDetails
        }
    }
    ${getFragment("PostsDetails")}
  `)
  const navigate = useNavigate();
  const currentUser = useCurrentUser()
  const [name, setName] = useState(currentUser?.displayName || "")
  const [email, setEmail] = useState(currentUser?.email ?? "")
  const [response, setResponse] = useState(initialResponse)
  const [error, setError] = useState("")
  const { MenuItem } = Components;

  return (
    <Components.LWDialog
      title={`RSVP to ${post.title}`}
      open={true}
      onClose={() => {
        navigate({...location, search: ``})
        if (onClose)
          onClose()
      }}
    >
      <DialogTitle>
        RSVP to {post.title}
      </DialogTitle>
      <DialogContent>
        <Input 
          value={name}
          placeholder={"Name"}
          onChange={e => setName(e.target.value)}
        />
        <Input
          value={email}
          placeholder={"Email (optional)"}
          onChange={e => setEmail(e.target.value)}
        />
        <Select
          value={response}
          onChange={e => setResponse(e.target.value)}
        >
          <MenuItem value="yes">{responseToText["yes"]}</MenuItem>
          <MenuItem value="maybe">{responseToText["maybe"]}</MenuItem>
          <MenuItem value="no">{responseToText["no"]}</MenuItem>
        </Select>
        {error && <div>
          {error}
        </div>}
        <p className={classes.emailMessage}>
          The provided email is only visible to the organizer.
        </p>
      </DialogContent>
      <DialogActions>
        <Button 
          type="submit"
          color="primary"
          onClick={async () => {
            if (name) {
              const { errors } = await registerRSVP({variables: {postId: post._id, name, email, response}})
              if (errors) {
                setError(`Oops, something went wrong: ${errors[0].message}`)
              } else if (onClose) {
                onClose()
              }
            } else {
              setError("Please provide a name")
            }
            
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Components.LWDialog>
  )
}

const RSVPFormComponent = registerComponent('RSVPForm', RSVPForm, {styles});

declare global {
  interface ComponentTypes {
    RSVPForm: typeof RSVPFormComponent
  }
}
