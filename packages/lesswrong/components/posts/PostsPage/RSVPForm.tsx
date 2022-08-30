import React, { useState } from 'react';
import { Components, registerComponent, getFragment } from '../../../lib/vulcan-lib';
import DialogContent from '@material-ui/core/DialogContent';
import { gql, useMutation } from '@apollo/client';
import Input from '@material-ui/core/Input';
import DialogTitle from '@material-ui/core/DialogTitle';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import { useNavigation } from '../../../lib/routeUtil';
import DialogActions from '@material-ui/core/DialogActions';
import { useCurrentUser } from '../../common/withUser';

export const responseToText = {
  yes: "Going",
  maybe: "Maybe",
  no: "Can't Go"
}

const RSVPForm = ({ post, onClose, initialResponse = "yes" }: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  initialResponse: string,
  onClose?: ()=>void,
}) => {
  const [registerRSVP] = useMutation(gql`
    mutation RegisterRSVP($postId: String, $name: String, $email: String, $private: Boolean, $response: String) {
        RSVPToEvent(postId: $postId, name: $name, email: $email, private: $private, response: $response) {
        ...PostsDetails
        }
    }
    ${getFragment("PostsDetails")}
  `)
  const { history } = useNavigation()
  const currentUser = useCurrentUser()
  const [name, setName] = useState(currentUser?.displayName || "")
  const [email, setEmail] = useState(currentUser?.email ?? "")
  const [response, setResponse] = useState(initialResponse)
  const [error, setError] = useState("")

  return (
    <Components.LWDialog
      title={`RSVP to ${post.title}`}
      open={true}
      onClose={() => {
        history.push({...location, search: ``})
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
        <p>
          <i>The provided email is only visible to the organizer.</i>
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

const RSVPFormComponent = registerComponent('RSVPForm', RSVPForm);

declare global {
  interface ComponentTypes {
    RSVPForm: typeof RSVPFormComponent
  }
}
