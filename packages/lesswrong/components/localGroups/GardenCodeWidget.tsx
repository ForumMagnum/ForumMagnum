import React, { useState } from 'react';
import { registerComponent, Components, getFragment } from '../../lib/vulcan-lib';
import { GardenCodes } from "../../lib/collections/gardencodes/collection";
import {Button, TextField} from "@material-ui/core";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {postBodyStyles} from "../../themes/stylePiping";
import {useTracking} from "../../lib/analyticsEvents";
import { ExpandedDate } from "../common/FormatDate";

const styles = (theme) => ({
  welcomeText: {
    ...postBodyStyles(theme)
  },
  inviteCode: {

  }
})

export const GardenCodeWidget = ({classes}:{classes:ClassesType}) => {
  const { SectionTitle, FormatDate } = Components
  const placeHolderSlug = 'ruby-asFw34jkfa'

  const { captureEvent } = useTracking()

  // const [codeGenerated, setCodeGenerated] = useState(false)
  const [currentCode, setCurrentCode] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const autoselectCode = (event) => {
    event.target.select()
  }

  const generatedLink = `https://wwww.lesswrong.com/walledGarden?inviteCode=${currentCode?._id}-${currentCode?.slug||""}`

  return <div>
    <SectionTitle title={"Generate personal invite links!"} />
    { !!currentCode
      ? <div>
        {console.log(currentCode) }
        {/*Here is your code! It is valid between {moment(new Date(currentCode?.startTime))} and {moment(new Date(currentCode?.endTime))}.*/}
        Here is your invite link! It is valid between <strong><ExpandedDate date={currentCode?.startTime}/></strong>
        and <strong><ExpandedDate date={currentCode?.endTime}/></strong>
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
            onCopy={ (text, result) => {
              setCopiedCode(result);
              captureEvent("gardenCodeLinkCopied", {generatedLink});
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
          <p>You can host guests in the Walled Garden, even if they're not full-time members. Use invite links to set up office hours, events, and general hangouts. Feel free to invite anyone who is considerate of those around them.</p>
          <p> Invite codes are valid for 4 hours from start time.</p>
        </div>
      <Components.WrappedSmartForm
        collection={GardenCodes}
        mutationFragment={getFragment("GardenCodeFragment")}
        queryFragment={getFragment("GardenCodeFragment")}
        successCallback={ code => {setCurrentCode(code)}}
      />
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

