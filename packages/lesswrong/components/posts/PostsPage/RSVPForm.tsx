import React, { useState } from 'react';
import { DialogContent } from "@/components/widgets/DialogContent";
import { useMutation } from "@apollo/client/react";
import { gql } from '@/lib/generated/gql-codegen';
import Input from '@/lib/vendor/@material-ui/core/src/Input';
import Select from '@/lib/vendor/@material-ui/core/src/Select';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { DialogActions } from '../../widgets/DialogActions';
import { DialogTitle } from '../../widgets/DialogTitle';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { useNavigate } from '../../../lib/routeUtil';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import LWDialog from "../../common/LWDialog";
import { MenuItem } from "../../common/Menus";

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
  const [registerRSVP] = useMutation(gql(`
    mutation RegisterRSVP($postId: String, $name: String, $email: String, $private: Boolean, $response: String) {
        RSVPToEvent(postId: $postId, name: $name, email: $email, private: $private, response: $response) {
        ...PostsDetails
        }
    }
  `))
  const navigate = useNavigate();
  const currentUser = useCurrentUser()
  const [name, setName] = useState(currentUser?.displayName || "")
  const [email, setEmail] = useState(currentUser?.email ?? "")
  const [response, setResponse] = useState(initialResponse)
  const [error, setError] = useState("")
  return (
    <LWDialog
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
              const { error } = await registerRSVP({variables: {postId: post._id, name, email, response}})
              if (error) {
                setError(`Oops, something went wrong: ${error.message}`)
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
    </LWDialog>
  )
}

export default registerComponent('RSVPForm', RSVPForm, {styles});


