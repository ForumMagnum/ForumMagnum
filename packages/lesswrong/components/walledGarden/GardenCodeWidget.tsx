import React, { useState } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import {Button, TextField} from "@material-ui/core";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {commentBodyStyles} from "../../themes/stylePiping";
import {useTracking} from "../../lib/analyticsEvents";
import { ExpandedDate } from "../common/FormatDate";
import { useUpdate } from '../../lib/crud/withUpdate';
import Users from "../../lib/vulcan-users";
import { useCurrentUser } from '../common/withUser';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';

const styles = (theme) => ({
  messageStyling: {
    ...commentBodyStyles(theme)
  },
  inviteCode: {

  }
})

export const GardenCodeWidget = ({classes}:{classes:ClassesType}) => {
  const { SectionTitle, FormatDate } = Components

  const { captureEvent } = useTracking()
  const currentUser =  useCurrentUser()
  const { mutate: updateUser } = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  })

  const [currentCode, setCurrentCode] = useState<GardenCodeFragment|null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const autoselectCode = (event) => {
    event.target.select()
  }

  const generatedLink = `localhost:3000/walledGardenPortal?code=${currentCode?.code}&event=${currentCode?.slug}`

  if (!currentUser) return null

  return <div className={classes.messageStyling}>
    <Typography variant="title">Generate Invite Links</Typography>
    {!!currentCode
      ? <div>
            Here is your code! It is valid from <strong>{moment(new Date(currentCode?.startTime)).format("dddd, MMMM Do, h:mma")}</strong> until <strong>{moment(new Date(currentCode?.endTime)).format("h:mma")}</strong>.
            <TextField
              className={classes.inviteCode}
              // label={"Your code!"}
              onClick={autoselectCode}
              onSelect={autoselectCode}
              value={generatedLink}
              fullWidth
            />
            <CopyToClipboard
              text={generatedLink}
              onCopy={(text, result) => {
              setCopiedCode(result);
              captureEvent("gardenCodeLinkCopied", {generatedLink})
              }}
              >
              <Button color="primary">{copiedCode ? "Copied!" : "Copy Link"}</Button>
            </CopyToClipboard>
            <Button onClick={() => {
              setCurrentCode(null)
              setCopiedCode(false)
            }}>
              Generate New Code
            </Button>
          </div>
      : <div>
          <div>
            <p>Use invite links to set up symposiums, co-working, general hangouts, and other events.
              Feel free to invite anyone who is considerate of those around them.
              Invite codes are valid for 4 hours from start time.</p>
          </div>
          <Components.WrappedSmartForm
            collection={GardenCodes}
            mutationFragment={getFragment("GardenCodeFragment")}
            queryFragment={getFragment("GardenCodeFragment")}
            successCallback={code => setCurrentCode(code)}/>
      </div>
    }
  </div>
}

const GardenCodeWidgetComponent = registerComponent('GardenCodeWidget', GardenCodeWidget, {styles});

declare global {
  interface ComponentTypes {
    GardenCodeWidget: typeof GardenCodeWidgetComponent
  }
}

