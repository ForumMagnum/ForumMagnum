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

const RSVPForm = ({ post, onClose }: {
  userId: string,
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  onClose: ()=>void,
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
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [response, setResponse] = useState("yes")
  return (
    <Components.LWDialog
      title={`RSVP to ${post.title}`}
      open={true}
      onClose={() => {
        history.push({...location, search: ``})
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
          <MenuItem value="yes">I'm Going</MenuItem>
          <MenuItem value="maybe">Maybe</MenuItem>
          <MenuItem value="no">Can't Go</MenuItem>
        </Select>
        <div>
          <Button 
            type="submit"
            onClick={() => {
              registerRSVP({variables: {postId: post._id, name, email, response}})
              onClose()
            }}
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Components.LWDialog>
  )
}

const RSVPFormComponent = registerComponent('RSVPForm', RSVPForm);

declare global {
  interface ComponentTypes {
    RSVPForm: typeof RSVPFormComponent
  }
}